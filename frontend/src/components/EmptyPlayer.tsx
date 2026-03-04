import { HiOutlineFolderOpen } from "react-icons/hi";

interface IProps {}

export default function EmptyPlayer(props: IProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="w-20 h-20 rounded-full bg-gray-800/10 flex items-center justify-center border border-dashed border-gray-600/50">
        <HiOutlineFolderOpen className="text-4xl text-gray-400" />
      </div>
    </div>
  );
}
