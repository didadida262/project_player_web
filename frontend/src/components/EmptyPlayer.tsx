import { HiMinus } from "react-icons/hi";

interface IProps {}

export default function EmptyPlayer(props: IProps) {
  return (
    <div className="w-full h-full flex flex-col justify-center items-center">
      <div className="w-16 h-16 rounded-full bg-gray-800/30 flex items-center justify-center border border-gray-600/30">
        <HiMinus className="text-3xl text-gray-500" />
      </div>
    </div>
  );
}
