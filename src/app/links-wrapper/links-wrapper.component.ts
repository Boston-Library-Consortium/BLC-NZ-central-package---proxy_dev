/*
IZ adds to custom.js:
window.IZ_CUSTOM_CONFIG = {
  linkWhiteListURL: [
    'special-collection-site.org',
    '^https://.*fdlp\\.gov'
  ],
  linkWhiteListLabel: [
    'Full text available',
    'Open Access.*'
  ]
};
*/

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-links-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: '', 
})
export class LinksWrapperComponent implements OnInit, OnDestroy {
  private observer: MutationObserver | null = null;
  public linkWhiteListURL: string[] = [];
  public linkWhiteListLabel: string[] = [];

  ngOnInit() {
    const domain = window.location.hostname;
    
    // Institution-specific customizations set centrally; IZ-set customizations override
    // Placeholder until a list is set centrally for an institution
    if (domain.includes('localhost')) {
      this.linkWhiteListURL = ['something', 'else'];
      this.linkWhiteListLabel = ['something','else'];
    }
    
    const localConfig = this.localParams();
    
    // Supports new linkWhiteListURL while keeping backwards compatibility with linkWhiteList
    const configuredUrls = localConfig?.linkWhiteListURL || localConfig?.linkWhiteList;
    if (Array.isArray(configuredUrls)) {
      this.linkWhiteListURL = configuredUrls;
    }

    if (Array.isArray(localConfig?.linkWhiteListLabel)) {
      this.linkWhiteListLabel = localConfig.linkWhiteListLabel;
    }

    const nzCoreWhitelistURL = ['sourceRecord'];
    const nzDefaultWhitelistURL = ['archive.org'];
    
    const flexibleListURL = (this.linkWhiteListURL.length > 0) 
      ? this.linkWhiteListURL 
      : nzDefaultWhitelistURL;

    // Final Merge
    const allowedUrls = Array.from(new Set([...nzCoreWhitelistURL, ...flexibleListURL]));
    const allowedLabels = Array.from(new Set([...this.linkWhiteListLabel]));

    console.log("NZ ENGINE: Active URL Whitelist:", allowedUrls);
    console.log("NZ ENGINE: Active Label Whitelist:", allowedLabels);

    this.observer = new MutationObserver(() => {
      const linksSection = document.querySelector('nde-full-display-links');

      if (linksSection) {
        const allLinks = linksSection.querySelectorAll('a');

        allLinks.forEach((link: HTMLAnchorElement) => {
          const href = link.href || '';
          const label = link.textContent?.trim() || '';
          
          const isAllowedURL = this.matchesPattern(href, allowedUrls);
          const isAllowedLabel = this.matchesPattern(label, allowedLabels);

          if (!isAllowedURL && !isAllowedLabel) {
            const container = link.closest('md-list-item') || 
                              link.closest('.prm-links-item') || 
                              link;
            
            if ((container as HTMLElement).style.display !== 'none') {
              (container as HTMLElement).style.display = 'none';
              console.log(`WHITE-LIST: Hid unauthorized link: ${href} (Label: "${label}")`);
            }
          }
        });
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  /**
   * Evaluates a target string (URL or Label) against an array of substrings or raw regex patterns.
   */
  private matchesPattern(target: string, patterns: string[]): boolean {
    if (!target || patterns.length === 0) return false;
    const lowerTarget = target.toLowerCase();

    return patterns.some((pattern: string) => {
      const cleanPattern = pattern.trim();
      if (!cleanPattern) return false;

      // 1. Simple Substring Match
      if (lowerTarget.includes(cleanPattern.toLowerCase())) {
        return true;
      }

      // 2. Raw Regex Match
      try {
        return new RegExp(cleanPattern, 'i').test(target);
      } catch {
        return false;
      }
    });
  }

  private localParams(): any {
    return (window as any).IZ_CUSTOM_CONFIG;
  }

  ngOnDestroy() {
    if (this.observer) this.observer.disconnect();
  }
}