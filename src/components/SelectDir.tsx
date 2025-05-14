import { useState } from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { Button, Input } from "antd";
import { useResources } from "../provider/resource-context";
interface IProps {}

export default function SelectDir(props: IProps) {
  const { currentpath, setCurrentpath, setCategories } = useResources();

  const handleSelectDirectory = async () => {
    const params = {
      type: "selectPath",
      data: "",
    };
    const res = (await api.get("/getFiles")) as any;
    console.log("rees>>>", res);
    // api.sendMessage(params as unknown as IPCInfo);
    // api.on("selectPath_back", (data: any) => {
    //   console.log("反馈结果>>>>", data);
    setCategories(res);
    setCurrentpath("D:\\RESP");
    // });
  };

  const scanDirectory = (dir: string) => {};
  return (
    <Button onClick={handleSelectDirectory} type="primary">
      打开路径
    </Button>
  );
}
