import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
