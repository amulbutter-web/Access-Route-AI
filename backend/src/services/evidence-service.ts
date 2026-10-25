// ============================================================
// AccessRoute AI — Evidence Service
// Person 4: Backend, TinyFish, Security, QA & Deployment
// ============================================================
// Orchestrates TinyFish lookups to retrieve supplementary
// accessibility evidence for campus locations. This service:
//
//  - Searches for accessibility information about specific locations
//  - Normalizes results into a consistent evidence format
//  - Computes relevance scores
//  - Falls back to local seed data when TinyFish is unavailable
//  - Clearly labels whether evidence is live, cached, or local
//
// BOUNDARY: Evidence from TinyFish is supplementary metadata.
// It does NOT override the route engine's graph-based decisions.
// A web page mentioning "accessible entrance" does NOT prove
// the connecting path is step-free or currently usable.
// ============================================================

import type { EvidenceResult, EvidenceSource, TinyFishConfig } from '../types';
import { TinyFishClient } from './tinyfish-client';
import { getNodeById } from './campus-data';
import { sanitizeExternalContent } from '../utils/sanitize';
import { createLogger } from '../utils/logger';

const logger = createLogger('evidence-service');

// --- Local Seed Evidence ---
// Pre-populated evidence for known locations when TinyFish is unavailable

const LOCAL_SEED_EVIDENCE: Record<string, {
  summary: string;
  sources: Array<{ title: string; snippet: string }>;
}> = {
  'main-gate': {
    summary: 'The Main Gate (Gate No. 1) of Delhi High Court on Sher Shah Road is the primary entrance for visitors and advocates. Ground level entry with security checkpoint. Vehicle drop-off area nearby.',
    sources: [
      {
        title: 'Delhi High Court Official Website',
        snippet: 'Delhi High Court, Sher Shah Road, New Delhi - 110503. Primary entrance with security screening.',
      },
    ],
  },
  'old-building': {
    summary: 'The Main Court Building (Old Block) is the original Delhi High Court structure housing courtrooms and the Registrar General office. Ground floor accessible via main entrance. Upper floors have elevator reported but operational status requires on-site confirmation.',
    sources: [
      {
        title: 'Delhi High Court Main Building',
        snippet: 'Historic court building with administrative offices, courtrooms, and the Registrar General on premises.',
      },
    ],
  },
  'c-block': {
    summary: 'The New Courts Block (C Block) was designed by Design Forum International. It houses 15 courtrooms across 4 floors and 9 Registrars Courts on the ground floor. Modern construction with ramp access and elevator facilities.',
    sources: [
      {
        title: 'New Courts Block — Design Forum International',
        snippet: 'The new C Block accommodates 15 courtrooms across four floors with modern accessibility features including ramp access.',
      },
    ],
  },
  's-block': {
    summary: 'S Block is the newest building in the Delhi High Court complex, inaugurated in December 2022. Features modern courtrooms and facilities with contemporary accessibility standards.',
    sources: [
      {
        title: 'S Block Building — Delhi High Court',
        snippet: 'Inaugurated December 2022 with additional courtrooms, modern facilities, and accessibility features.',
      },
    ],
  },
  'bar-library': {
    summary: 'The Bar Library is maintained by the Delhi High Court Bar Association for advocates reference and study. Ground floor entrance is accessible from the central courtyard via a paved walkway.',
    sources: [
      {
        title: 'Delhi High Court Bar Association',
        snippet: 'Bar Library located within the court complex on Sher Shah Road, New Delhi.',
      },
    ],
  },
  'canteen': {
    summary: 'The High Court Canteen and Cafeteria serves advocates, staff, and visitors. Ground level facility with step-free entry reported.',
    sources: [
      {
        title: 'Delhi High Court Campus Facilities',
        snippet: 'Dining facility within the court complex serving the legal community.',
      },
    ],
  },
  'filing-counter': {
    summary: 'The Filing Counter and Registry is where cases, petitions, and legal documents are filed. Located on the ground floor with accessible counter height reported.',
    sources: [
      {
        title: 'Delhi High Court Registry',
        snippet: 'Court registry and filing counter for case submissions and legal document processing.',
      },
    ],
  },
};

export class EvidenceService {
  private tinyFishClient: TinyFishClient;
  private config: TinyFishConfig;

  constructor(config: TinyFishConfig) {
    this.config = config;
    this.tinyFishClient = new TinyFishClient(config);
  }

  /**
   * Looks up accessibility evidence for a campus location.
   *
   * Strategy:
   * 1. Try TinyFish Search API for live web results
   * 2. If TinyFish fails, use local seed evidence
   * 3. Clearly label the source in the result
   *
   * @param locationId - Campus node ID
   * @returns EvidenceResult with sources and metadata
   */
  async lookupEvidence(locationId: string): Promise<EvidenceResult> {
    const node = getNodeById(locationId);
    const locationName = node?.name || locationId;
    const now = new Date().toISOString();

    logger.info('Looking up evidence', { locationId, locationName });

    // Attempt TinyFish search
    try {
      const searchResult = await this.tinyFishClient.search({
        query: `${locationName} Delhi High Court accessibility wheelchair accessible entrance ramp`,
        purpose: 'Find accessibility information for Delhi High Court campus navigation. Looking for details about wheelchair access, ramps, elevators, step-free pathways in the court complex.',
        location: 'IN',
        language: 'en',
      });

      if (searchResult.response && searchResult.response.results.length > 0) {
        const sources = this.normalizeSearchResults(searchResult.response.results);
        const summary = this.generateSummary(locationName, sources);

        return {
          query: `Accessibility info for ${locationName}`,
          locationName,
          sources,
          summary,
          confidence: sources.length >= 3 ? 'medium' : 'low',
          retrievedAt: now,
          provider: searchResult.cached ? 'local_cache' : 'tinyfish_search',
          isCached: searchResult.cached,
          cacheAge: searchResult.cacheAge,
        };
      }

      // TinyFish returned no results — fall back to local
      if (searchResult.error) {
        logger.warn('TinyFish search failed, using local seed', {
          locationId,
          error: searchResult.error,
        });
      }
    } catch (error) {
      logger.error('TinyFish search threw, using local seed', {
        locationId,
        error: error instanceof Error ? error.message : 'Unknown',
      });
    }

    // Fall back to local seed evidence
    return this.getLocalEvidence(locationId, locationName, now);
  }

  /**
   * Fetches detailed content from a specific URL for accessibility info.
   * Used when a search result looks promising and more detail is needed.
   */
  async fetchDetailedEvidence(url: string, locationName: string): Promise<EvidenceResult> {
    const now = new Date().toISOString();

    try {
      const fetchResult = await this.tinyFishClient.fetchUrl({
        urls: [url],
        format: 'markdown',
        purpose: `Extract accessibility and wheelchair access information for ${locationName} at IIIT Delhi`,
      });

      if (fetchResult.response && fetchResult.response.results.length > 0) {
        const result = fetchResult.response.results[0];
        return {
          query: `Detailed accessibility info from ${url}`,
          locationName,
          sources: [{
            title: sanitizeExternalContent(result.title, 200),
            url: result.final_url || url,
            snippet: sanitizeExternalContent(result.text, 2000),
            siteName: new URL(result.final_url || url).hostname,
            relevanceScore: 0.7,
            retrievedAt: now,
          }],
          summary: `Detailed page content retrieved from ${result.title || url}. ` +
            `Content has been extracted but not verified for accuracy. ` +
            `Web content is supplementary — it does not certify physical accessibility.`,
          confidence: 'low',
          retrievedAt: now,
          provider: fetchResult.cached ? 'local_cache' : 'tinyfish_search',
          isCached: fetchResult.cached,
          cacheAge: fetchResult.cacheAge,
        };
      }

      // Fetch failed
      return {
        query: `Detailed accessibility info from ${url}`,
        locationName,
        sources: [],
        summary: fetchResult.error || 'Failed to fetch page content.',
        confidence: 'none',
        retrievedAt: now,
        provider: 'tinyfish_search',
        isCached: false,
      };

    } catch (error) {
      return {
        query: `Detailed accessibility info from ${url}`,
        locationName,
        sources: [],
        summary: `Failed to fetch: ${error instanceof Error ? error.message : 'Unknown error'}`,
        confidence: 'none',
        retrievedAt: now,
        provider: 'tinyfish_search',
        isCached: false,
      };
    }
  }

  /**
   * Returns the TinyFish client's health status.
   */
  async checkTinyFishHealth() {
    return this.tinyFishClient.healthCheck();
  }

  /**
   * Returns last known health without making a new request.
   */
  getLastTinyFishHealth() {
    return this.tinyFishClient.getLastHealthStatus();
  }

  /**
   * Clears all TinyFish caches.
   */
  clearCache(): void {
    this.tinyFishClient.clearCache();
  }

  // --- Private Helpers ---

  private normalizeSearchResults(results: Array<{
    position: number;
    site_name: string;
    title: string;
    snippet: string;
    url: string;
  }>): EvidenceSource[] {
    return results
      .slice(0, 5) // Limit to top 5 results
      .map((r, idx) => ({
        title: r.title || 'Untitled',
        url: r.url,
        snippet: r.snippet || '',
        siteName: r.site_name || 'Unknown',
        relevanceScore: Math.max(0.1, 1 - idx * 0.2), // Decreasing by position
        retrievedAt: new Date().toISOString(),
      }));
  }

  private generateSummary(locationName: string, sources: EvidenceSource[]): string {
    if (sources.length === 0) {
      return `No web-based accessibility information found for ${locationName}. ` +
        `On-site verification is recommended.`;
    }

    const snippetParts = sources
      .slice(0, 3)
      .map(s => s.snippet)
      .filter(s => s.length > 20)
      .join(' | ');

    return `Found ${sources.length} web source(s) mentioning ${locationName}. ` +
      `Key excerpts: ${snippetParts || 'No detailed excerpts available.'}. ` +
      `DISCLAIMER: Web sources are supplementary evidence. They do not certify ` +
      `physical accessibility or current conditions. On-site verification recommended.`;
  }

  private getLocalEvidence(
    locationId: string,
    locationName: string,
    timestamp: string
  ): EvidenceResult {
    const seed = LOCAL_SEED_EVIDENCE[locationId];

    if (seed) {
      logger.info('Using local seed evidence', { locationId });
      return {
        query: `Local evidence for ${locationName}`,
        locationName,
        sources: seed.sources.map(s => ({
          title: s.title,
          url: '',
          snippet: s.snippet,
          siteName: 'Local Data',
          relevanceScore: 0.5,
          retrievedAt: timestamp,
        })),
        summary: seed.summary + ' [Source: Local seed data — not from live web lookup]',
        confidence: 'low',
        retrievedAt: timestamp,
        provider: 'local_seed',
        isCached: false,
      };
    }

    // No local data available either
    logger.info('No evidence available', { locationId });
    return {
      query: `Evidence for ${locationName}`,
      locationName,
      sources: [],
      summary: `No accessibility information is available for ${locationName}. ` +
        `Neither TinyFish lookup nor local seed data produced results. ` +
        `On-site verification is strongly recommended before relying on this route.`,
      confidence: 'none',
      retrievedAt: timestamp,
      provider: 'local_seed',
      isCached: false,
    };
  }
}
