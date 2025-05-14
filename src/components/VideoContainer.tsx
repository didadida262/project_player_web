import { useEffect } from 'react'
import { useResources } from '../provider/resource-context'
import { Button } from 'antd'

export default function VideoContainer() {
  const {
    currentfileurl,
    palyerMode,
    setPalyerMode,
    currentFile,
    selectFile,
    setCurrentFile,
    getNextVideo,
  } = useResources()

  const handlePlayMode = () => {
    setPalyerMode(palyerMode === 'order' ? 'random' : 'order')
  }
  const handleNext = () => {
    const nextFile = getNextVideo()
    setCurrentFile(nextFile)
  }

  useEffect(() => {}, currentfileurl)

  useEffect(() => {
    if (!currentFile.name) return
    selectFile(currentFile)
  }, [currentFile])

  return (
    <div className="w-full h-full flex justify-between items-center flex-col">
      <div className="video w-full h-[calc(100%_-_55px)] selectedG flex justify-center items-center">
        <video
          muted
          className="w-full h-full object-fit"
          autoPlay
          controls
          src={currentfileurl}
          onEnded={handleNext} // 直接监听结束事件
        />
      </div>
      <div className="operation w-full h-[50px] flex justify-start items-center gap-x-[20px]">
        {palyerMode === 'order' ? (
          <Button type="primary" onClick={handlePlayMode}>
            顺序播放
          </Button>
        ) : (
          <Button type="primary" onClick={handlePlayMode}>
            随机播放
          </Button>
        )}

        <Button type="primary" onClick={handleNext}>
          下一首
        </Button>
      </div>
    </div>
  )
}
