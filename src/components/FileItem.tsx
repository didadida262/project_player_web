import {
  FolderOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileImageOutlined,
  VideoCameraOutlined,
  FileUnknownOutlined,
} from '@ant-design/icons'
import cn from 'classnames'
import { useResources } from '../provider/resource-context'

interface IProps {
  file: any
}
type FileType = 'directory' | 'video' | 'word' | 'pdf' | 'image' | 'audio'
const renderIcon = (type: FileType) => {
  const mapIcon = {
    directory: <FolderOutlined />,
    video: <VideoCameraOutlined />,
    word: <FileWordOutlined />,
    pdf: <FilePdfOutlined />,
    image: <FileImageOutlined />,
    audio: <FileImageOutlined />,
  }
  return mapIcon[type] ? mapIcon[type] : <FileUnknownOutlined />
}
export default function FileItem(props: IProps) {
  const { currentFile, setCurrentFile, currentfileurl, setcurrentfileurl } =
    useResources()
  const { file } = props

  const handleClick = () => {
    setCurrentFile(file)
  }

  return (
    <div
      className={cn(
        'w-[100px] h-[110px] flex flex-col justify-between items-center hover:cursor-pointer',
        'border-[1px] border-solid border-[#383b45]',
        'hover:border-[#0acaff] hover:border-[3px]',
        currentFile.name === file.name ? 'border-[#0acaff] border-[3px]' : '',
        'mx-[10px]'
      )}
      style={{ display: 'inline-block' }}
      onClick={handleClick}
    >
      <div className="w-full h-[calc(100%_-_30px)] flex justify-center items-center text-[30px]">
        {renderIcon(file.type)}
      </div>
      <div className="w-full h-[30px] flex justify-center items-center truncate text-[12px]">
        {file.name.length > 10 ? file.name.slice(0, 10) + '...' : file.name}
      </div>
    </div>
  )
}
