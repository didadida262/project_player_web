import { useEffect } from 'react'
import { useResources } from '../provider/resource-context'
import { Image } from 'antd'

export default function AudioContainer() {
  const { currentfileurl } = useResources()

  return (
    <div className="w-full h-full flex justify-center items-center">
      <audio src={currentfileurl} controls />
    </div>
  )
}
