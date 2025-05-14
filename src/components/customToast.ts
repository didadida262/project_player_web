/*
 * @Description: 
 * @Author: didadida262
 * @Date: 2024-08-01 17:30:22
 * @LastEditors: didadida262
 * @LastEditTime: 2024-08-01 17:38:57
 */
import { toast } from 'react-toastify';

// const theme = localStorage.getItem('chain-ide-THEME_MODE');

const isLight = () => {
  const theme = localStorage.getItem('chain-ide-THEME_MODE');
  return theme?.includes('Light');
};

const customToast = {
  success(msg: string, options = {}) {
    return toast.success(msg, {
      ...options,
      className: isLight()
        ? 'toast-light-bg toast-light-succes'
        : 'toast-dark-bg toast-dark-succes',
      progressClassName: isLight()
        ? 'toast-light-progress-success'
        : 'toast-dark-progress-success'
    });
  },
  error(msg: string, options = {}) {
    return toast.error(msg, {
      ...options,
      className: isLight() ? 'toast-light-bg' : 'toast-dark-bg',
      progressClassName: isLight()
        ? 'toast-light-progress-error'
        : 'toast-dark-progress-error'
    });
  },
  info(msg: string, options = {}) {
    return toast.info(msg, {
      ...options,
      className: isLight()
        ? 'toast-light-bg toast-light-info'
        : 'toast-dark-bg toast-light-info',
      progressClassName: isLight()
        ? 'toast-light-progress-info'
        : 'toast-dark-progress-info'
    });
  },
  warning(msg: string, options = {}) {
    return toast.info(msg, {
      ...options,
      className: isLight() ? 'toast-light-bg' : 'toast-dark-bg',
      progressClassName: isLight()
        ? 'toast-light-progress-warn'
        : 'toast-dark-progress-warn'
    });
  }
};
export default customToast;
