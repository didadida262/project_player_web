import { useResources } from '../provider/resource-context'
import FileItem from './FileItem'
import { useEffect, useRef, useState, useCallback } from 'react'
import { HiSearch, HiOutlineRefresh, HiOutlineSearch } from 'react-icons/hi'
import { getFiles } from '@/api/common'
import type { ApiResponse } from '@/api'

export default function FileList() {
  const { sourcelist, currentFile, currentCate, setSourcelist, setCurrentFile } =
    useResources()
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [keyword, setKeyword] = useState('')
  const [appliedKeyword, setAppliedKeyword] = useState('')
  const [isSearching, setIsSearching] = useState(false)

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

        setSourcelist(list)
      } catch (error) {
        console.error('搜索文件失败', error)
      } finally {
        setIsSearching(false)
      }
    },
    [currentCate?.path, setSourcelist]
  )

  useEffect(() => {
    if (!currentCate?.path) return
    fetchFiles(appliedKeyword)
  }, [currentCate?.path, appliedKeyword, fetchFiles])

  const handleSearchClick = () => {
    setAppliedKeyword(keyword)
  }

  useEffect(() => {
    if (currentFile.name && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const selectedElement = Array.from(container.children).find(
        (child) => (child as HTMLElement).dataset?.name === currentFile.name
      ) as HTMLElement | undefined

      if (selectedElement) {
        selectedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        })
      }
    }
  }, [currentFile.name, sourcelist])

  return (
    <div className="w-full h-full flex flex-col gap-3 pr-2">
      <div className="w-full flex items-center gap-2">
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
        className="w-full h-full overflow-y-auto flex flex-col gap-3 pr-2"
      >
        {sourcelist.length === 0 ? (
          <div className="flex flex-1 items-center justify-center">
            <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg border border-dashed border-[#0acaff] bg-gradient-to-r from-[#0acaff0d] via-[#0acaff14] to-[#0acaff0d] shadow-[0_0_10px_rgba(10,202,255,0.25)]">
              <div className="w-10 h-10 rounded-full border-2 border-[#0acaff] border-dashed flex items-center justify-center text-[#0acaff]">
                <HiOutlineSearch size={18} />
              </div>
              <div className="text-[11px] text-gray-300">未找到匹配的文件</div>
            </div>
          </div>
        ) : (
          sourcelist.map((file: any, index: number) => (
            <FileItem file={file} key={index}></FileItem>
          ))
        )}
      </div>
    </div>
  )
}
