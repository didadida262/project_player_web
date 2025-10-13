import { useState } from "react";
import api from "../api/index";
import { IPCInfo } from "../utils/index";
import { Button, Input } from "antd";
import { useResources } from "../provider/resource-context";
import { getFiles } from "@/api/common";

interface IProps {}

export default function SelectDir(props: IProps) {
  const { currentpath, setCurrentpath, setCategories } = useResources();

  const handleSelectDirectory = async () => {
    const params = { path: currentpath };
    console.log("currentpath", currentpath);
    const res = (await getFiles(params)) as any;
    console.log("dirs>>>", res);
    setCategories(res);
  };

  const scanDirectory = (dir: string) => {};
  return (
    <Button onClick={handleSelectDirectory} type="primary">
      开始扫描
    </Button>
  );
}
