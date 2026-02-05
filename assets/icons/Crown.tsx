import { SvgXml } from 'react-native-svg';

export const Crown = (props: any) => {
    const xml = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M2.5 7.5L5.5 17.5H18.5L21.5 7.5L16 12L12 5L8 12L2.5 7.5Z" fill="#FFD700" stroke="#DAA520" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
<path d="M5.5 17.5V19.5C5.5 20.0523 5.94772 20.5 6.5 20.5H17.5C18.0523 20.5 18.5 20.0523 18.5 19.5V17.5" stroke="#DAA520" stroke-width="1.5"/>
<circle cx="12" cy="5" r="1" fill="#DAA520"/>
<circle cx="2.5" cy="7.5" r="1" fill="#DAA520"/>
<circle cx="21.5" cy="7.5" r="1" fill="#DAA520"/>
</svg>
    `;
    const prop = { ...props, xml };
    return <SvgXml {...prop} />;
};
