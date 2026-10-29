import { useEffect, useState } from "preact/hooks";

let sendToast: (text: string, time: number) => void = (_, __) => {};
let toast_timeout: null | NodeJS.Timeout = null;

export function useToast() {
  const [toastData, setToastData] = useState<{ text: string, show: boolean }>({ text: "", show: false });

  useEffect(() => {
    sendToast = (value: string, time: number) => {
      setToastData({ text: value, show: true });

      if (toast_timeout !== null) {
        clearTimeout(toast_timeout);
      }

      toast_timeout = setTimeout(() => setToastData(t => { return { ...t, show: false } }), time);
    };
  }, []);

  const toastShow = toastData.show;
  const toastText = toastData.text;

  return {toastShow, toastText, sendToast}
}
