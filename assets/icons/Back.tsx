import { SvgXml } from 'react-native-svg';

export const Back = (props: any) => {
  const xml = `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M14.1974 17.938C13.9091 18.1851 13.4751 18.1517 13.228 17.8634L7.728 11.4468C7.50732 11.1893 7.50732 10.8094 7.728 10.5519L13.228 4.13525C13.4751 3.84697 13.9091 3.81358 14.1974 4.06068C14.4857 4.30778 14.5191 4.7418 14.272 5.03009L9.15548 10.9993L14.272 16.9686C14.5191 17.2569 14.4857 17.6909 14.1974 17.938Z" fill="#391D65"/>
</svg>
    `;
  const prop = { ...props, xml };
  return <SvgXml {...prop} />;
};
