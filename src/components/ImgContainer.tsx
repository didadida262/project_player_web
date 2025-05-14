import { useEffect } from 'react'
import { useResources } from '../provider/resource-context'
import { Image } from 'antd'

export default function ImgContainer() {
  const { currentfileurl } = useResources()

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Image
        src={currentfileurl}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover', // 关键属性：控制图片填充方式
        }}
        preview={false}
      />
    </div>
  )
}
