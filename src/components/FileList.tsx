import { useResources } from '../provider/resource-context'
import FileItem from './FileItem'
import cn from 'classnames'
import { useEffect } from 'react'

export default function FileList() {
  const { sourcelist } = useResources()

  return (
    <div
      className={cn('w-full h-full', 'overflow-x-auto')}
      style={{ whiteSpace: 'nowrap' }}
    >
      {sourcelist.map((file: any, index: number) => (
        <FileItem file={file} key={index}></FileItem>
      ))}
    </div>
  )
}
