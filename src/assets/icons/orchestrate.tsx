import * as React from 'react';
const SvgComponent = (props: any) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={26} height={22} fill="none" {...props}>
    <path
      stroke={props.fill || '#7D8998'}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.478 6.283 4.592 4.37m0 0 1.298.107m-1.298-.107.068 1.32M12.849 3.687V1m0 0 .85.987M12.849 1l-.878.987M19.5 6.315l1.935-1.866m0 0-.12 1.297m.12-1.297-1.32.054M22.298 12.821l2.687.046m0 0-1.001.833m1.001-.833-.972-.894M3.687 12.822H1m0 0 .987-.85m-.987.85.987.877"
    />
    <path
      fill={props.fill || '#7D8998'}
      fillRule="evenodd"
      d="M12.608 5.934v.948c0 .222-.096.42-.249.558a.623.623 0 0 1-.401.243c-.508.082-1.226.445-1.533.631a.625.625 0 0 1-.802-.132l-.86-1.023-.775.692-.1.099.988 1.187a.625.625 0 0 1 .039.747l-2.632 3.942h1.272a.625.625 0 0 1 .623.672c-.043.579-.095 1.808-.006 2.378.015.092.066.168.187.24a.985.985 0 0 0 .37.123h1.5a.625.625 0 1 1 0 1.25H8.7c-.016 0-.032 0-.047-.002a2.22 2.22 0 0 1-.936-.297c-.341-.204-.693-.561-.78-1.121-.082-.517-.072-1.35-.045-1.993H5.114a.625.625 0 0 1-.52-.972l3.022-4.527L6.563 8.31a.625.625 0 0 1 .039-.841l.514-.514a.626.626 0 0 1 .026-.025l1.27-1.132a.625.625 0 0 1 .894.064l.945 1.124a7.22 7.22 0 0 1 .857-.366V5.455a.75.75 0 0 1 .398-.662.622.622 0 0 1 .352-.109h2.445c.345 0 .625.28.625.625v1.2c.186.054.39.12.591.194.192.07.413.161.622.273l.806-.79a.625.625 0 0 1 .876.002l1.63 1.604c.241.238.249.625.017.873l-.836.893c.078.176.163.375.245.574.072.174.146.36.21.537h1.224c.345 0 .625.28.625.625v2.419c0 .345-.28.625-.625.625h-1.218c-.058.18-.125.38-.197.577-.069.19-.15.398-.236.592l.87.87a.625.625 0 0 1-.024.908l-1.732 1.553a.625.625 0 0 1-.864-.028l-.704-.72-.215.216a.625.625 0 1 1-.884-.884l.662-.662a.625.625 0 0 1 .889.005l.727.743.795-.713-.73-.73a.625.625 0 0 1-.074-.795c.082-.12.21-.407.346-.783.128-.353.242-.72.307-.946a.625.625 0 0 1 .601-.453h1.056v-1.17h-1.056a.625.625 0 0 1-.608-.48 7.139 7.139 0 0 0-.301-.831 25.212 25.212 0 0 0-.397-.91.625.625 0 0 1 .111-.69l.704-.751-.758-.747-.733.717a.625.625 0 0 1-.88-.005c-.076-.076-.312-.208-.686-.346a7.903 7.903 0 0 0-.92-.276.625.625 0 0 1-.486-.609V5.934h-1.07Z"
      clipRule="evenodd"
    />
    <path
      stroke={props.fill || '#7D8998'}
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.578 19.621h3.26m-2.75 1.502h2.139"
    />
  </svg>
);
export default SvgComponent;
