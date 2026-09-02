import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(dateInput: string | Date): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 30) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function getLanguageColor(lang: string = ''): { bg: string; iconBg: string } {
  const l = lang.toLowerCase();

  // Brand-appropriate colors per language, used for the icon container
  // background so classroom cards are colored/scannable by language at a
  // glance, instead of relying solely on the icon SVG's own contrast
  // (which varies — some devicon assets are logo-only with no fill).
  const mapping: Record<string, { bg: string; iconBg: string }> = {
    javascript: { bg: '#292929', iconBg: '#F7DF1E' },
    typescript: { bg: '#3178C6', iconBg: '#FFFFFF' },
    python: { bg: '#3776AB', iconBg: '#FFD43B' },
    html: { bg: '#E34F26', iconBg: '#FFFFFF' },
    css: { bg: '#1572B6', iconBg: '#FFFFFF' },
    java: { bg: '#EA2D2E', iconBg: '#FFFFFF' },
    cpp: { bg: '#00599C', iconBg: '#FFFFFF' },
    react: { bg: '#20232A', iconBg: '#61DAFB' },
    vue: { bg: '#42B883', iconBg: '#FFFFFF' },
    angular: { bg: '#DD0031', iconBg: '#FFFFFF' },
    php: { bg: '#777BB4', iconBg: '#FFFFFF' },
    ruby: { bg: '#CC342D', iconBg: '#FFFFFF' },
    go: { bg: '#00ADD8', iconBg: '#FFFFFF' },
    rust: { bg: '#2F2F2F', iconBg: '#FFFFFF' },
    swift: { bg: '#F05138', iconBg: '#FFFFFF' },
    kotlin: { bg: '#7F52FF', iconBg: '#FFFFFF' },
    dart: { bg: '#0175C2', iconBg: '#FFFFFF' },
    sql: { bg: '#336791', iconBg: '#FFFFFF' },
    bash: { bg: '#2D2D2D', iconBg: '#4EAA25' },
    nextjs: { bg: '#000000', iconBg: '#FFFFFF' },
    express: { bg: '#2D2D2D', iconBg: '#FFFFFF' },
    django: { bg: '#092E20', iconBg: '#44B78B' },
    flask: { bg: '#2D2D2D', iconBg: '#FFFFFF' },
    csharp: { bg: '#68217A', iconBg: '#FFFFFF' },
    lua: { bg: '#2C2D72', iconBg: '#FFFFFF' },
    perl: { bg: '#39457E', iconBg: '#FFFFFF' },
    r: { bg: '#276DC3', iconBg: '#FFFFFF' },
  };

  return mapping[l] || { bg: '#3B82F6', iconBg: '#FFFFFF' };
}

export function getLanguageIcon(lang: string = ''): string {
  const l = lang.toLowerCase();
  
  const mapping: Record<string, string> = {
    'javascript': 'javascript/javascript-original.svg',
    'python': 'python/python-original.svg',
    'cpp': 'cplusplus/cplusplus-original.svg',
    'java': 'java/java-original.svg',
    'typescript': 'typescript/typescript-original.svg',
    'react': 'react/react-original.svg',
    'vue': 'vuejs/vuejs-original.svg',
    'angular': 'angularjs/angularjs-original.svg',
    'html': 'html5/html5-original.svg',
    'css': 'css3/css3-original.svg',
    'php': 'php/php-original.svg',
    'ruby': 'ruby/ruby-original.svg',
    'go': 'go/go-original.svg',
    'rust': 'rust/rust-plain.svg',
    'swift': 'swift/swift-original.svg',
    'kotlin': 'kotlin/kotlin-original.svg',
    'dart': 'dart/dart-original.svg',
    'sql': 'postgresql/postgresql-original.svg',
    'bash': 'bash/bash-original.svg',
    'nextjs': 'nextjs/nextjs-original.svg',
    'express': 'express/express-original.svg',
    'django': 'django/django-plain.svg',
    'flask': 'flask/flask-original.svg',
    'csharp': 'csharp/csharp-original.svg',
    'lua': 'lua/lua-original.svg',
    'perl': 'perl/perl-original.svg',
    'r': 'r/r-original.svg',
  };

  const path = mapping[l] || 'javascript/javascript-original.svg';
  return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}`;
}
