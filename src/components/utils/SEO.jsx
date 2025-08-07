import React, { useEffect } from 'react';

const SEO = ({ title, description, keywords, ogUrl, ogImage }) => {
  useEffect(() => {
    // Set basic meta tags
    document.title = title;
    updateMetaTag('description', description);
    updateMetaTag('keywords', keywords);

    // Set Open Graph (for social media sharing)
    updateMetaTag('og:title', title, 'property');
    updateMetaTag('og:description', description, 'property');
    updateMetaTag('og:url', ogUrl, 'property');
    updateMetaTag('og:image', ogImage, 'property');
    updateMetaTag('og:type', 'website', 'property');
    
    // Set Twitter Card
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', title);
    updateMetaTag('twitter:description', description);
    updateMetaTag('twitter:image', ogImage);

  }, [title, description, keywords, ogUrl, ogImage]);

  const updateMetaTag = (name, content, attr = 'name') => {
    let element = document.querySelector(`meta[${attr}='${name}']`);
    if (!element) {
      element = document.createElement('meta');
      element.setAttribute(attr, name);
      document.head.appendChild(element);
    }
    element.setAttribute('content', content);
  };

  return null; // This component does not render anything
};

export default SEO;