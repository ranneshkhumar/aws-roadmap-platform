import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

// 1. AWS Step Functions Icon (Workflow orchestration / sequential steps)
export const StepFunctionsIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* Step Functions Pink theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#step-func-bg)" stroke="#db2777" strokeWidth="1.5" />
    {/* Workflow sequence path */}
    <circle cx="20" cy="20" r="4" fill="#ffffff" />
    <circle cx="44" cy="44" r="4" fill="#ffffff" />
    {/* Connected nodes */}
    <rect x="26" y="26" width="12" height="12" rx="2" fill="#ffffff" />
    {/* Transition lines */}
    <path d="M22 23 L28 29" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 35 L42 41" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <defs>
      <linearGradient id="step-func-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f472b6" /> {/* pink-400 */}
        <stop offset="100%" stopColor="#db2777" /> {/* pink-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 2. Amazon S3 Icon (Bucket/Storage / revisit anytime)
export const S3Icon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* S3 Green theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#s3-bg)" stroke="#059669" strokeWidth="1.5" />
    {/* Bucket / Storage Cylinder Cylinder */}
    <path
      d="M20 20 C20 16, 44 16, 44 20 L44 40 C44 46, 20 46, 20 40 Z"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.5"
    />
    <path d="M20 28 C20 32, 44 32, 44 28" fill="none" stroke="#ffffff" strokeWidth="2" />
    <path d="M20 36 C20 40, 44 40, 44 36" fill="none" stroke="#ffffff" strokeWidth="2" />
    <ellipse cx="32" cy="20" rx="12" ry="4" fill="#ffffff" opacity="0.3" />
    <defs>
      <linearGradient id="s3-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#34d399" /> {/* emerald-400 */}
        <stop offset="100%" stopColor="#059669" /> {/* emerald-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 3. AWS IAM Icon (Security / Unlock topics through progress)
export const IAMIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* IAM Red theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#iam-bg)" stroke="#dc2626" strokeWidth="1.5" />
    {/* Shield with key */}
    <path
      d="M32 16 C37 16, 46 19, 46 25 L46 38 C46 45, 32 49, 32 49 C32 49, 18 45, 18 38 L18 25 C18 19, 27 16, 32 16 Z"
      fill="none"
      stroke="#ffffff"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    {/* Key symbol inside shield */}
    <circle cx="32" cy="27" r="3.5" fill="#ffffff" />
    <path d="M32 30.5 L32 41 M32 35 L36 35 M32 38 L35 38" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="iam-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#f87171" /> {/* red-400 */}
        <stop offset="100%" stopColor="#dc2626" /> {/* red-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 4. AWS Config Icon (Governance / Quiz attempt policy)
export const ConfigIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* Config Blue theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#config-bg)" stroke="#2563eb" strokeWidth="1.5" />
    {/* Outer rotating/tracking ring */}
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeDasharray="6 3" />
    {/* Inner compliance center */}
    <circle cx="32" cy="32" r="7" fill="#ffffff" />
    {/* Small inner detail */}
    <circle cx="32" cy="32" r="3" fill="#2563eb" />
    <defs>
      <linearGradient id="config-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#60a5fa" /> {/* blue-400 */}
        <stop offset="100%" stopColor="#2563eb" /> {/* blue-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 5. Amazon CloudWatch Icon (Monitoring / Earn points)
export const CloudWatchIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* CloudWatch Fuchsia theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#cw-bg)" stroke="#c026d3" strokeWidth="1.5" />
    {/* Gauge Radar/Scope */}
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ffffff" strokeWidth="2.5" />
    {/* Radar grid lines */}
    <path d="M32 18 L32 46 M18 32 L46 32" stroke="#ffffff" strokeWidth="1" opacity="0.5" />
    {/* Sweeper needle */}
    <path d="M32 32 L41 23" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    <defs>
      <linearGradient id="cw-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#e879f9" /> {/* fuchsia-400 */}
        <stop offset="100%" stopColor="#c026d3" /> {/* fuchsia-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 6. Amazon QuickSight Icon (Analytics / Quiz accuracy rewards)
export const QuickSightIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* QuickSight Purple-Blue theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#qs-bg)" stroke="#4f46e5" strokeWidth="1.5" />
    {/* Analytics sectors/pie */}
    <path d="M32 18 C40 18, 46 24, 46 32 L32 32 Z" fill="#ffffff" />
    <circle cx="32" cy="32" r="14" fill="none" stroke="#ffffff" strokeWidth="2.5" />
    {/* Bar chart inside */}
    <rect x="22" y="34" width="4" height="8" fill="#ffffff" opacity="0.7" />
    <rect x="28" y="30" width="4" height="12" fill="#ffffff" />
    <rect x="34" y="26" width="4" height="16" fill="#ffffff" opacity="0.9" />
    <defs>
      <linearGradient id="qs-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#818cf8" /> {/* indigo-400 */}
        <stop offset="100%" stopColor="#4f46e5" /> {/* indigo-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 7. AWS Cost Explorer Icon (Cost / Example Scoring analysis)
export const CostExplorerIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* Cost Explorer Teal theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#ce-bg)" stroke="#0d9488" strokeWidth="1.5" />
    {/* Cost bars / breakdown chart */}
    <path
      d="M18 44 L26 36 L34 40 L46 22"
      fill="none"
      stroke="#ffffff"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="46" cy="22" r="3" fill="#ffffff" />
    {/* Dollar symbol shadow grid or indicator */}
    <path d="M22 28 H42 M22 34 H42 M22 40 H42" stroke="#ffffff" strokeWidth="1" opacity="0.3" />
    <defs>
      <linearGradient id="ce-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2dd4bf" /> {/* teal-400 */}
        <stop offset="100%" stopColor="#0d9488" /> {/* teal-600 */}
      </linearGradient>
    </defs>
  </svg>
);

// 8. AWS Application Composer Icon (Architecture Composer / learning path)
export const ApplicationComposerIcon: React.FC<IconProps> = ({ size = 18, ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="flex-shrink-0 select-none"
    {...props}
  >
    {/* Application Composer Violet theme */}
    <rect x="6" y="6" width="52" height="52" rx="8" fill="url(#ac-bg)" stroke="#7c3aed" strokeWidth="1.5" />
    {/* Visual builder canvas cards connected */}
    <rect x="18" y="16" width="12" height="12" rx="2" fill="none" stroke="#ffffff" strokeWidth="2.5" />
    <rect x="36" y="32" width="12" height="12" rx="2" fill="none" stroke="#ffffff" strokeWidth="2.5" />
    {/* Connector path with dot */}
    <path d="M30 22 H34 V38 H36" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
    <circle cx="34" cy="30" r="2.5" fill="#ffffff" />
    <defs>
      <linearGradient id="ac-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#a78bfa" /> {/* violet-400 */}
        <stop offset="100%" stopColor="#7c3aed" /> {/* violet-600 */}
      </linearGradient>
    </defs>
  </svg>
);
