import { useResources } from '../provider/resource-context'
import FileItem from './FileItem'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { HiSearch, HiOutlineRefresh, HiOutlineSearch } from 'react-icons/hi'
import { getFiles } from '@/api/common'
import type { ApiResponse } from '@/api'
import { isDirectory } from '../utils/mimeTypes'
import { isFlatSubfoldersDir } from '../utils/flatSubfolders'

/** 卡片高度与卡片间距（对应 FileItem 的 h-[110px] 与列表的 12px 间隔），虚拟滚动按此定位 */
const ITEM_HEIGHT = 110
const ITEM_GAP = 12
const ROW_HEIGHT = ITEM_HEIGHT + ITEM_GAP
/** 视口上下各多渲染几屏外的卡片，滚动时不会看到空白 */
const OVERSCAN = 4

export default function FileList() {
  const { sourcelist, currentFile, currentCate, setSourcelist, setCurrentFile } =
    useResources()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(0)

  const fetchFiles = useCallback(
    async (kw: string) => {
      if (!currentCate?.path) return
      try {
        setIsSearching(true)
        const params: Record<string, string> = {
          path: currentCate.path,
          _ts: Date.now().toString(), // 前端防缓存，避免命中 304
        }
        const trimmed = kw.trim()
        if (trimmed) {
          params.keyword = trimmed
        }

        const res = (await getFiles<any[]>(params)) as unknown
        let list: any[] = []
        if (Array.isArray(res)) {
          list = res
        } else if (Array.isArray((res as ApiResponse<any[]>)?.data)) {
          list = (res as ApiResponse<any[]>)?.data || []
        }

        setSourcelist(
          isFlatSubfoldersDir(currentCate?.name)
            ? list
            : list.filter((item) => !isDirectory(item.type)),
        )
      } catch (error) {
        console.error('搜索文件失败', error)
      } finally {
        setIsSearching(false)
      }
    },
    [currentCate?.path, currentCate?.name, setSourcelist]
  )

  useEffect(() => {
    if (!currentCate?.path) return
    fetchFiles(appliedKeyword)
  }, [currentCate?.path, appliedKeyword, fetchFiles])

  const handleSearchClick = () => {
    setAppliedKeyword(keyword)
  }

  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el) return
    setViewportHeight(el.clientHeight)
    const observer = new ResizeObserver(() => setViewportHeight(el.clientHeight))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // 滚动按帧节流：滚动事件本身很密集，逐次 setState 会让长列表明显掉帧
  const scrollRafRef = useRef<number | null>(null)
  const handleScroll = useCallback(() => {
    if (scrollRafRef.current !== null) return
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null
      const el = scrollContainerRef.current
      if (el) setScrollTop(el.scrollTop)
    })
  }, [])

  useEffect(
    () => () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current)
      }
    },
    []
  )

  const total = sourcelist.length
  const { startIndex, visibleFiles } = useMemo(() => {
    const height = viewportHeight || ITEM_HEIGHT * 6
    const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN)
    const end = Math.min(
      total,
      Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN
    )
    return { startIndex: start, visibleFiles: sourcelist.slice(start, end) }
  }, [sourcelist, total, scrollTop, viewportHeight])

  // 选中项滚动到中间：直接算 scrollTop，避免 smooth 动画在长列表里持续重排
  useEffect(() => {
    const el = scrollContainerRef.current
    if (!el || !currentFile?.name) return
    const index = sourcelist.findIndex(
      (item: any) => item.name === currentFile.name
    )
    if (index < 0) return
    const centered = index * ROW_HEIGHT - Math.max(0, (el.clientHeight - ITEM_HEIGHT) / 2)
    const maxTop = Math.max(0, total * ROW_HEIGHT - ITEM_GAP - el.clientHeight)
    const next = Math.max(0, Math.min(centered, maxTop))
    el.scrollTop = next
    setScrollTop(next)
  }, [currentFile.name, sourcelist, total])

  return (
    <div className="w-full h-full flex flex-col gap-3 pr-2">
      <div className="w-full shrink-0 flex items-center gap-2">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchClick()
            }
          }}
          placeholder="搜索"
          className="flex-1 min-w-0 px-3 py-1.5 bg-[#1f2430] text-white text-xs rounded border border-[#383b45] focus:outline-none focus:border-[#0acaff] placeholder:text-gray-400"
        />
        <button
          onClick={handleSearchClick}
          className="h-[34px] px-3 flex items-center justify-center bg-[#0acaff] text-white rounded border border-[#0acaff] hover:brightness-95 active:brightness-90"
          aria-label="搜索"
        >
          {isSearching ? (
            <HiOutlineRefresh size={16} className="animate-spin" />
          ) : (
            <HiSearch size={16} />
          )}
        </button>
      </div>
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="w-full flex-1 min-h-0 overflow-y-auto pr-2"
      >
        {total === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#0acaff] bg-gradient-to-r from-[#0acaff0d] via-[#0acaff14] to-[#0acaff0d] shadow-[0_0_10px_rgba(10,202,255,0.25)]">
              <div className="w-10 h-10 rounded-full border-2 border-[#0acaff] border-dashed flex items-center justify-center text-[#0acaff]">
                <HiOutlineSearch size={18} />
              </div>
              <div className="text-[11px] text-gray-300">未找到匹配的文件</div>
            </div>
          </div>
        ) : (
          <div
            className="relative w-full"
            style={{ height: total * ROW_HEIGHT - ITEM_GAP }}
          >
            {visibleFiles.map((file: any, offset: number) => {
              const index = startIndex + offset
              return (
                <div
                  key={file.path || `${file.name}-${index}`}
                  className="absolute left-0 right-0"
                  style={{ top: index * ROW_HEIGHT, height: ITEM_HEIGHT }}
                >
                  <FileItem
                    file={file}
                    selected={currentFile.name === file.name}
                    cateName={currentCate?.name}
                    onSelect={setCurrentFile}
                  />
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
