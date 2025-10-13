import { HiPlay } from "react-icons/hi";

interface IProps {}

export default function EmptyPlayer(props: IProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="w-16 h-16 rounded-full bg-gray-800/50 flex items-center justify-center border border-gray-600/50">
        <HiPlay className="text-2xl text-gray-400" />
      </div>
    </div>
  );
}
