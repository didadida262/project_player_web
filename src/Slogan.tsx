import { useEffect } from "react";

import { useTranslation } from "@/i18n";

export default function Slogan() {
  useEffect(() => {}, []);
  const { t } = useTranslation();

  return <div>{t("slogan")}</div>;
}
