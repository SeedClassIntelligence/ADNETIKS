/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * ADNETIKS Workflow Automations Library (n8n & Activepieces)
 * Generates genuine, importable, brand-auto-populated n8n workflow JSON and Activepieces
 * flow templates for Lead/CRM routing, Sales follow-up, Competitor monitoring, Auto-Launches,
 * and Executive ROI reporting — extending ADNETIKS far beyond social posting.
 */

export type AutomationCategory =
  | 'lead_crm'
  | 'sales_followup'
  | 'content_launch'
  | 'competitor_intel'
  | 'reporting';

export type AutomationEngine = 'n8n' | 'activepieces';

export interface AutomationBrandContext {
  brandName: string;
  websiteUrl: string;
  primaryColor: string;
  adnetiksBaseUrl: string;
}

export interface AutomationStepPreview {
  label: string;
  tool: string;
  kind: 'trigger' | 'ai' | 'action' | 'notify';
}

export interface AutomationTemplate {
  id: string;
  title: string;
  category: AutomationCategory;
  categoryLabel: string;
  badge: string;
  summary: string;
  businessOutcome: string;
  triggerType: 'webhook' | 'schedule';
  webhookSlug: string;
  cronExpression?: string;
  steps: AutomationStepPreview[];
  samplePayload: Record<string, any>;
  adnetiksEndpoint?: {
    method: 'GET' | 'POST';
    path: string;
    bodyTemplate?: (ctx: AutomationBrandContext) => Record<string, any>;
  };
  externalDestinationHint: string;
}

export const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'auto-lead-crm-followup',
    title: 'Ad Click & Conversion → CRM + Instant Lead Alert',
    category: 'lead_crm',
    categoryLabel: 'Lead & CRM',
    badge: 'Revenue Capture',
    summary:
      'Whenever someone clicks an ADNETIKS UTM link or triggers your conversion pixel, automatically log the lead in HubSpot / Google Sheets and alert your sales team on Slack or email within 2 seconds.',
    businessOutcome: 'Respond to warm ad leads in under 60 seconds instead of losing them in spreadsheets.',
    triggerType: 'webhook',
    webhookSlug: 'adnetiks-lead-capture',
    steps: [
      { label: 'Conversion Event', tool: 'ADNETIKS Pixel / UTM', kind: 'trigger' },
      { label: 'Score Intent', tool: 'Filter Lead / Purchase', kind: 'ai' },
      { label: 'Create CRM Contact', tool: 'HubSpot / Sheets / Notion', kind: 'action' },
      { label: 'Instant Team Alert', tool: 'Slack / Email / SMS', kind: 'notify' },
    ],
    samplePayload: {
      event: 'conversion.recorded',
      eventName: 'Lead',
      platform: 'linkedin',
      variantLabel: 'Variant A',
      source: 'conversion_pixel',
      leadEmail: 'buyer@prospect-company.com',
    },
    externalDestinationHint: 'Connect your HubSpot, Salesforce, Google Sheets, or Slack node in the final step.',
  },
  {
    id: 'auto-new-page-launch',
    title: 'New Website Page or Product Drop → 1-Click Campaign',
    category: 'content_launch',
    categoryLabel: 'Content & Launch',
    badge: 'Zero-Touch Launch',
    summary:
      'Watches your website sitemap, blog RSS, or Shopify store for any newly published page or product — automatically triggers ADNETIKS 1-Click Launch to build ads, creatives, and social drafts for approval.',
    businessOutcome: 'Every new offer, feature, or drop gets a full multi-channel ad kit automatically.',
    triggerType: 'webhook',
    webhookSlug: 'adnetiks-new-offer-drop',
    steps: [
      { label: 'New Page / Product', tool: 'Shopify / RSS / CMS Hook', kind: 'trigger' },
      { label: 'Run 1-Click Launch', tool: 'ADNETIKS /api/onboard', kind: 'ai' },
      { label: 'Create Brand Ad PNG', tool: 'ADNETIKS Creative Studio', kind: 'action' },
      { label: 'Send For Approval', tool: 'Slack / Email Digest', kind: 'notify' },
    ],
    samplePayload: {
      event: 'offer.published',
      offerTitle: 'New Product Release',
      autoApprove: false,
    },
    adnetiksEndpoint: {
      method: 'POST',
      path: '/api/onboard',
      bodyTemplate: (ctx) => ({
        url: ctx.websiteUrl,
        platforms: ['linkedin', 'x', 'instagram', 'tiktok'],
      }),
    },
    externalDestinationHint: 'Point your Shopify, Webflow, WordPress, or Stripe webhook to this trigger.',
  },
  {
    id: 'auto-competitor-counter-ad',
    title: 'Weekly Competitor Watch → Auto "Old Way vs. Us" Counter-Ad',
    category: 'competitor_intel',
    categoryLabel: 'Competitor Intel',
    badge: 'Competitive Edge',
    summary:
      'Runs every Monday morning to inspect competitor pricing or feature pages, then calls ADNETIKS to draft fresh comparison copy and an "Old Way vs. New Way" ad creative ready for your review.',
    businessOutcome: 'Stay ahead of competitor promotions automatically without manual research.',
    triggerType: 'schedule',
    webhookSlug: 'adnetiks-competitor-watch',
    cronExpression: '0 9 * * 1',
    steps: [
      { label: 'Every Monday 9 AM', tool: 'Schedule Trigger', kind: 'trigger' },
      { label: 'Generate Counter-Ad', tool: 'ADNETIKS /api/generate-image', kind: 'ai' },
      { label: 'Save Creative Asset', tool: 'Google Drive / Notion', kind: 'action' },
      { label: 'Notify Marketing Lead', tool: 'Slack / Teams', kind: 'notify' },
    ],
    samplePayload: {
      event: 'competitor.weekly_scan',
      creativeStyle: 'old_vs_new',
    },
    adnetiksEndpoint: {
      method: 'POST',
      path: '/api/generate-image',
      bodyTemplate: (ctx) => ({
        prompt: `High-converting Old Way vs New Way comparison ad for ${ctx.brandName}`,
        aspectRatio: '1:1',
        creativeStyle: 'old_vs_new',
        brandProfile: {
          name: ctx.brandName,
          archetype: 'The Strategist',
          websiteUrl: ctx.websiteUrl,
          brandColors: { primary: ctx.primaryColor, secondary: '#B45309', background: '#0C1622', swatches: [ctx.primaryColor] },
        },
      }),
    },
    externalDestinationHint: 'Add an HTTP Request node for any competitor URL before the ADNETIKS call.',
  },
  {
    id: 'auto-dm-sales-routing',
    title: 'High-Intent DM or Comment → Calendar Link + CRM Deal',
    category: 'sales_followup',
    categoryLabel: 'Sales & Follow-Up',
    badge: 'Inbox-to-Booking',
    summary:
      'Detects buyers asking about pricing, demos, or quotes inside your social inbox, automatically drafts a reply with your booking link, and opens a qualified deal in your CRM.',
    businessOutcome: 'Turn casual comments and DMs into booked sales calls while you sleep.',
    triggerType: 'webhook',
    webhookSlug: 'adnetiks-inbox-intent',
    steps: [
      { label: 'Inbound DM / Mention', tool: 'ADNETIKS Inbox Hook', kind: 'trigger' },
      { label: 'Detect Buying Intent', tool: 'Pricing / Demo Filter', kind: 'ai' },
      { label: 'Log Deal in CRM', tool: 'Pipedrive / HubSpot', kind: 'action' },
      { label: 'Send Booking Reply', tool: 'Calendly / Cal.com Link', kind: 'notify' },
    ],
    samplePayload: {
      event: 'inbox.high_intent_dm',
      platform: 'linkedin',
      senderName: 'Alex Rivera',
      message: 'Love this breakdown — how does pricing work for our team?',
      intentScore: 96,
    },
    externalDestinationHint: 'Drop your Cal.com or Calendly link into the response step and connect your CRM.',
  },
  {
    id: 'auto-ab-winner-newsletter',
    title: 'A/B Hook Winner → Auto Email Blast & Brand Brain Sync',
    category: 'sales_followup',
    categoryLabel: 'Sales & Follow-Up',
    badge: 'Closed-Loop Scale',
    summary:
      'The moment an A/B ad hook wins in ADNETIKS, automatically lock that winning angle into your Brand Brain memory and repurpose it into a ready-to-send email newsletter draft.',
    businessOutcome: 'Multiply every winning ad angle across email and outbound sales automatically.',
    triggerType: 'webhook',
    webhookSlug: 'adnetiks-ab-winner',
    steps: [
      { label: 'A/B Winner Declared', tool: 'ADNETIKS Split Lab', kind: 'trigger' },
      { label: 'Distill Brand Memory', tool: 'ADNETIKS /api/memory/synthesize', kind: 'ai' },
      { label: 'Draft Email Campaign', tool: 'Resend / Mailchimp / Beehiiv', kind: 'action' },
      { label: 'Post Win Summary', tool: 'Slack #growth', kind: 'notify' },
    ],
    samplePayload: {
      event: 'ab_test.winner_declared',
      winnerVariant: 'Variant A',
      ctrLift: '+42%',
      winningHook: 'Stop giving your phone number to quote sites that resell your lead.',
    },
    adnetiksEndpoint: {
      method: 'POST',
      path: '/api/memory/synthesize',
      bodyTemplate: (ctx) => ({ brandName: ctx.brandName }),
    },
    externalDestinationHint: 'Connect Resend, Mailchimp, ConvertKit, or Beehiiv to auto-create the newsletter draft.',
  },
  {
    id: 'auto-weekly-roi-cost-digest',
    title: 'Weekly Owner Digest: Real Clicks, Conversions & AI Spend',
    category: 'reporting',
    categoryLabel: 'Executive Reporting',
    badge: 'Owner Visibility',
    summary:
      'Every Monday at 8:00 AM, automatically pulls your real ADNETIKS attribution stats and Live AI Cost Ledger, then sends a clean plain-English ROI & spend summary to your inbox or Slack.',
    businessOutcome: 'Know your exact marketing clicks, leads, and AI dollar spend every week without logging in.',
    triggerType: 'schedule',
    webhookSlug: 'adnetiks-weekly-digest',
    cronExpression: '0 8 * * 1',
    steps: [
      { label: 'Every Monday 8 AM', tool: 'Schedule Trigger', kind: 'trigger' },
      { label: 'Fetch Attribution', tool: 'ADNETIKS /api/events', kind: 'action' },
      { label: 'Fetch AI Spend', tool: 'ADNETIKS /api/usage', kind: 'action' },
      { label: 'Email / Slack Owner', tool: 'Gmail / Slack Report', kind: 'notify' },
    ],
    samplePayload: {
      event: 'reporting.weekly_digest',
      period: 'last_7_days',
    },
    adnetiksEndpoint: {
      method: 'GET',
      path: '/api/usage',
    },
    externalDestinationHint: 'Connect Gmail, Outlook, or Slack in the final node to receive the weekly digest.',
  },
  {
    id: 'auto-review-to-proof-ad',
    title: 'New 5-Star Customer Review → Social Proof Ad Graphic',
    category: 'content_launch',
    categoryLabel: 'Content & Launch',
    badge: 'Social Proof Engine',
    summary:
      'Triggers whenever a customer submits a 5-star review (Typeform, Google Reviews, Trustpilot, or Stripe) and automatically renders a clean Benefit Spotlight ad creative in your brand colors.',
    businessOutcome: 'Turn happy customer quotes into high-converting proof ads with zero designer time.',
    triggerType: 'webhook',
    webhookSlug: 'adnetiks-review-to-ad',
    steps: [
      { label: 'New 5-Star Review', tool: 'Typeform / Google / Stripe', kind: 'trigger' },
      { label: 'Render Proof Ad PNG', tool: 'ADNETIKS /api/generate-image', kind: 'ai' },
      { label: 'Save to Media Vault', tool: 'ADNETIKS Vault', kind: 'action' },
      { label: 'Send For 1-Click Post', tool: 'Slack / Email', kind: 'notify' },
    ],
    samplePayload: {
      event: 'review.five_star',
      customerName: 'Jordan M.',
      quote: 'Saved us $1,400/year with zero spam phone calls.',
      rating: 5,
    },
    adnetiksEndpoint: {
      method: 'POST',
      path: '/api/generate-image',
      bodyTemplate: (ctx) => ({
        prompt: `5-star customer testimonial social proof ad for ${ctx.brandName}`,
        aspectRatio: '1:1',
        creativeStyle: 'proof_spotlight',
        headline: 'Verified Customer Result — Zero Guesswork',
        brandProfile: {
          name: ctx.brandName,
          archetype: 'The Strategist',
          websiteUrl: ctx.websiteUrl,
          brandColors: { primary: ctx.primaryColor, secondary: '#B45309', background: '#0C1622', swatches: [ctx.primaryColor] },
        },
      }),
    },
    externalDestinationHint: 'Connect Typeform, Tally, Google Business Profile, or Trustpilot to trigger on 5-star reviews.',
  },
  {
    id: 'auto-post-publish-archive',
    title: 'Approved Campaign Post → Multi-Channel Publish + Notion Archive',
    category: 'lead_crm',
    categoryLabel: 'Lead & CRM',
    badge: 'Content Ops',
    summary:
      'Receives every approved ADNETIKS post webhook, routes it to your publishing channels (LinkedIn, X, IG, TikTok), logs the live URL in Notion or Airtable, and tracks campaign velocity.',
    businessOutcome: 'Keep a clean, searchable archive of every live ad & post automatically.',
    triggerType: 'webhook',
    webhookSlug: 'adnetiks-publish-archive',
    steps: [
      { label: 'Post Dispatched', tool: 'ADNETIKS Delivery Bridge', kind: 'trigger' },
      { label: 'Route By Platform', tool: 'Platform Switch', kind: 'ai' },
      { label: 'Log In Content Hub', tool: 'Notion / Airtable', kind: 'action' },
      { label: 'Confirm Live Link', tool: 'Slack #marketing', kind: 'notify' },
    ],
    samplePayload: {
      event: 'post.dispatched',
      platform: 'linkedin',
      variantLabel: 'Variant A',
      status: 'published',
    },
    externalDestinationHint: 'Connect Notion, Airtable, or Postiz nodes to log and distribute automatically.',
  },
];

/**
 * Generates genuine, importable n8n Workflow JSON auto-populated with the user's
 * active Brand Name, Website URL, Colors, and ADNETIKS API endpoints.
 */
export function buildN8nWorkflowJson(
  template: AutomationTemplate,
  ctx: AutomationBrandContext
): Record<string, any> {
  const baseUrl = (ctx.adnetiksBaseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const workflowName = `[ADNETIKS · ${ctx.brandName}] ${template.title}`;

  const triggerNode =
    template.triggerType === 'schedule'
      ? {
          parameters: {
            rule: {
              interval: [{ field: 'cronExpression', expression: template.cronExpression || '0 9 * * 1' }],
            },
          },
          id: 'adnetiks-trigger-1',
          name: template.steps[0]?.label || 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [220, 300],
        }
      : {
          parameters: {
            httpMethod: 'POST',
            path: `${template.webhookSlug}-${ctx.brandName.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 18)}`,
            responseMode: 'lastNode',
            options: {},
          },
          id: 'adnetiks-trigger-1',
          name: template.steps[0]?.label || 'ADNETIKS Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 2,
          position: [220, 300],
        };

  const brandContextNode = {
    parameters: {
      assignments: {
        assignments: [
          { id: 'b1', name: 'brandName', value: ctx.brandName, type: 'string' },
          { id: 'b2', name: 'websiteUrl', value: ctx.websiteUrl, type: 'string' },
          { id: 'b3', name: 'primaryColor', value: ctx.primaryColor, type: 'string' },
          { id: 'b4', name: 'adnetiksBaseUrl', value: baseUrl, type: 'string' },
          { id: 'b5', name: 'automationId', value: template.id, type: 'string' },
        ],
      },
      includeOtherFields: true,
      options: {},
    },
    id: 'adnetiks-brand-ctx-2',
    name: `Inject ${ctx.brandName} Brand Context`,
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [480, 300],
  };

  const httpMethod = template.adnetiksEndpoint?.method || 'POST';
  const httpPath = template.adnetiksEndpoint?.path || '/api/events';
  const httpBody = template.adnetiksEndpoint?.bodyTemplate
    ? template.adnetiksEndpoint.bodyTemplate(ctx)
    : {
        eventName: template.samplePayload.eventName || 'AutomationRun',
        campaignId: template.id,
        platform: template.samplePayload.platform || 'automation',
        source: 'n8n_workflow',
        brandName: ctx.brandName,
        url: ctx.websiteUrl,
      };

  const adnetiksApiNode = {
    parameters: {
      method: httpMethod,
      url: `${baseUrl}${httpPath}`,
      sendBody: httpMethod === 'POST',
      specifyBody: 'json',
      jsonBody: httpMethod === 'POST' ? JSON.stringify(httpBody, null, 2) : undefined,
      options: { timeout: 30000 },
    },
    id: 'adnetiks-api-3',
    name: `ADNETIKS Action (${httpPath})`,
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4.2,
    position: [760, 300],
  };

  const summaryNode = {
    parameters: {
      assignments: {
        assignments: [
          { id: 's1', name: 'status', value: 'completed', type: 'string' },
          { id: 's2', name: 'brand', value: ctx.brandName, type: 'string' },
          { id: 's3', name: 'workflow', value: template.title, type: 'string' },
          { id: 's4', name: 'nextStepHint', value: template.externalDestinationHint, type: 'string' },
        ],
      },
      includeOtherFields: true,
      options: {},
    },
    id: 'adnetiks-output-4',
    name: template.steps[3]?.label || 'Prepare Notification Payload',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [1040, 300],
  };

  return {
    name: workflowName,
    nodes: [triggerNode, brandContextNode, adnetiksApiNode, summaryNode],
    connections: {
      [triggerNode.name]: {
        main: [[{ node: brandContextNode.name, type: 'main', index: 0 }]],
      },
      [brandContextNode.name]: {
        main: [[{ node: adnetiksApiNode.name, type: 'main', index: 0 }]],
      },
      [adnetiksApiNode.name]: {
        main: [[{ node: summaryNode.name, type: 'main', index: 0 }]],
      },
    },
    active: false,
    settings: {
      executionOrder: 'v1',
    },
    tags: [{ name: 'ADNETIKS' }, { name: ctx.brandName }],
    meta: {
      generatedBy: 'ADNETIKS Campaign & Automation OS',
      brandName: ctx.brandName,
      websiteUrl: ctx.websiteUrl,
      templateId: template.id,
    },
  };
}

/**
 * Generates genuine, importable Activepieces Flow Template JSON auto-populated with
 * the active Brand Name, Website URL, Brand Colors, and ADNETIKS API endpoints.
 */
export function buildActivepiecesFlowJson(
  template: AutomationTemplate,
  ctx: AutomationBrandContext
): Record<string, any> {
  const baseUrl = (ctx.adnetiksBaseUrl || 'http://localhost:3000').replace(/\/$/, '');
  const displayName = `[ADNETIKS · ${ctx.brandName}] ${template.title}`;
  const httpMethod = template.adnetiksEndpoint?.method || 'POST';
  const httpPath = template.adnetiksEndpoint?.path || '/api/events';
  const httpBody = template.adnetiksEndpoint?.bodyTemplate
    ? template.adnetiksEndpoint.bodyTemplate(ctx)
    : {
        eventName: template.samplePayload.eventName || 'AutomationRun',
        campaignId: template.id,
        source: 'activepieces_flow',
        brandName: ctx.brandName,
        url: ctx.websiteUrl,
      };

  const trigger =
    template.triggerType === 'schedule'
      ? {
          name: 'trigger',
          valid: true,
          displayName: template.steps[0]?.label || 'Schedule Trigger',
          type: 'PIECE_TRIGGER',
          settings: {
            pieceName: '@activepieces/piece-schedule',
            pieceVersion: '~0.1.5',
            triggerName: 'cron_expression',
            input: {
              cronExpression: template.cronExpression || '0 9 * * 1',
              timezone: 'UTC',
            },
          },
        }
      : {
          name: 'trigger',
          valid: true,
          displayName: template.steps[0]?.label || 'ADNETIKS Webhook Trigger',
          type: 'WEBHOOK',
          settings: {
            inputUiInfo: {
              currentSelectedData: {
                ...template.samplePayload,
                brandName: ctx.brandName,
                websiteUrl: ctx.websiteUrl,
              },
            },
          },
        };

  return {
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    name: displayName,
    description: `${template.summary} (Auto-populated for ${ctx.brandName} · ${ctx.websiteUrl})`,
    tags: ['ADNETIKS', template.categoryLabel, ctx.brandName],
    pieces: ['@activepieces/piece-http', '@activepieces/piece-schedule'],
    template: {
      displayName,
      trigger: {
        ...trigger,
        nextAction: {
          name: 'step_1',
          type: 'PIECE',
          valid: true,
          displayName: `Call ADNETIKS (${httpPath})`,
          settings: {
            pieceName: '@activepieces/piece-http',
            pieceVersion: '~0.6.0',
            actionName: 'send_request',
            input: {
              method: httpMethod,
              url: `${baseUrl}${httpPath}`,
              headers: {
                'Content-Type': 'application/json',
                'X-ADNETIKS-Brand': ctx.brandName,
              },
              body_type: httpMethod === 'POST' ? 'json' : 'none',
              body: httpMethod === 'POST' ? httpBody : undefined,
            },
          },
          nextAction: {
            name: 'step_2',
            type: 'CODE',
            valid: true,
            displayName: template.steps[3]?.label || 'Format Output for CRM / Slack / Email',
            settings: {
              input: {
                brandName: ctx.brandName,
                websiteUrl: ctx.websiteUrl,
                primaryColor: ctx.primaryColor,
                adnetiksResponse: '{{step_1.body}}',
              },
              sourceCode: {
                code: `export const code = async (inputs) => {\n  return {\n    ok: true,\n    brand: inputs.brandName,\n    website: inputs.websiteUrl,\n    summary: "${template.title.replace(/"/g, "'")} completed for " + inputs.brandName,\n    nextStepHint: "${template.externalDestinationHint.replace(/"/g, "'")}",\n    result: inputs.adnetiksResponse\n  };\n};`,
                packageJson: '{}',
              },
            },
          },
        },
      },
      valid: true,
      schemaVersion: '1',
    },
  };
}
