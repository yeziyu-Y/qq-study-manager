import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

mermaid.initialize({
  startOnLoad: true,
  theme: 'base',
  themeVariables: {
    primaryColor: '#c8e6c9',
    primaryTextColor: '#1b5e20',
    primaryBorderColor: '#2e7d32',
    lineColor: '#4caf50',
    secondaryColor: '#e8f5e9',
    tertiaryColor: '#ffffff',
  },
  securityLevel: 'loose',
});

interface MermaidProps {
  chart: string;
}

const Mermaid: React.FC<MermaidProps> = ({ chart }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      mermaid.contentLoaded();
      // Clear previous content
      ref.current.removeAttribute('data-processed');
      ref.current.innerHTML = chart;
      mermaid.init(undefined, ref.current);
    }
  }, [chart]);

  return <div key={chart} ref={ref} className="mermaid flex justify-center items-center w-full h-full" />;
};

export default Mermaid;
