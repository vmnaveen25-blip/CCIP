import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import ForceGraph3D, { ForceGraphMethods } from 'react-force-graph-3d';
import * as THREE from 'three';
import SpriteText from 'three-spritetext';
import { Complaint } from '../../types';
import { INITIAL_COMPLAINTS } from '../../data/mockData';
import {
  Share2,
  RotateCw,
  X,
  Copy,
  Check,
  ExternalLink,
  ChevronDown,
  ZoomIn,
  Move,
  Maximize2,
  RotateCcw,
  Plus
} from 'lucide-react';

interface CrossCaseCorrelationPortalViewProps {
  onSelectTab: (tab: string) => void;
  onSelectCase?: (caseId: string) => void;
  complaints?: Complaint[];
  selectedCaseId?: string;
}

export interface CorrelationGraphNode {
  id: string;
  label: string;
  sublabel: string;
  type: 'case' | 'domain' | 'ip' | 'related-case' | 'url' | 'bank' | 'email' | 'mobile';
  badge: 'ACTIVE CASE' | 'Malicious' | 'Unverified' | 'Related' | 'Verified';
  badgeType: 'active' | 'danger' | 'warning' | 'info' | 'success';
  glowColor: string;
  iconBg: string;
  iconColor: string;
  iconType: string;
  x?: number;
  y?: number;
  z?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  // Inspector metadata
  sourceProvenance: string;
  firstSeen: string;
  lastSeen: string;
  statusText: string;
  reputation: string;
  relatedCasesCount: number;
  explanation: string;
  relatedItems: Array<{
    id: string;
    label: string;
    typeDesc: string;
    badge: string;
    badgeType: 'danger' | 'info' | 'warning' | 'success';
    iconType: 'domain' | 'related-case' | 'url' | 'ip' | 'mobile' | 'bank' | 'email';
  }>;
}

export interface CorrelationGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  style: 'solid-green' | 'dashed-amber' | 'solid-red' | 'solid-amber' | 'dashed-grey';
  badgeColor?: string;
  verified: boolean;
}

export function buildCorrelationGraphForCase(
  caseId: string,
  allComplaints: Complaint[]
): { nodes: CorrelationGraphNode[]; edges: CorrelationGraphEdge[]; defaultSelectedNodeId: string } {
  const matchedComplaint = allComplaints.find(
    c => c.id === caseId || c.referenceNumber.toLowerCase() === caseId.toLowerCase()
  ) || allComplaints.find(c => c.id === 'case-7102') || allComplaints[0];

  const normId = matchedComplaint?.id || caseId;
  const refNum = matchedComplaint?.referenceNumber || 'CYBER-2026-7102';

  // 1. CASE-7033 (CYBER-2026-7033: Mule Account Syndicated Network)
  if (normId === 'case-7033' || refNum === 'CYBER-2026-7033') {
    const centerNode: CorrelationGraphNode = {
      id: 'node-case-7033',
      label: 'CYBER-2026-7033',
      sublabel: 'Mule Account Syndicated Network',
      type: 'case',
      iconType: 'case',
      badge: 'ACTIVE CASE',
      badgeType: 'active',
      glowColor: '#00e676',
      iconBg: '#052e16',
      iconColor: '#00e676',
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
      fz: 0,
      sourceProvenance: 'Delhi Cybercell docket & Citizen complaint (Rahul Verma)',
      firstSeen: '11 Jun 2026, 03:18 PM',
      lastSeen: '14 Jun 2026, 06:45 PM',
      statusText: '• ACTIVE CASE',
      reputation: 'Syndicated counterfeit gateway and mule operation (State Cyber Cell)',
      relatedCasesCount: 3,
      explanation: 'Primary Anchor Case: Online retail fraud docket where ₹48,500 was debited via counterfeit storefront and fraudulent Razorpay payment gateway mimic.',
      relatedItems: [
        { id: 'node-domain-7033', label: 'mega-deal-electronics.shop', typeDesc: 'Domain • contains URL', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • C2 infrastructure', badge: 'Malicious', badgeType: 'danger', iconType: 'ip' },
        { id: 'node-bank-mule', label: 'XXXX 8821', typeDesc: 'Bank Account • Axis Indiranagar Mule Pool', badge: 'Unverified', badgeType: 'warning', iconType: 'bank' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • shared IP & mule accounts', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const domainNode: CorrelationGraphNode = {
      id: 'node-domain-7033',
      label: 'mega-deal-electronics.shop',
      sublabel: 'Domain',
      type: 'domain',
      iconType: 'domain',
      badge: 'Malicious',
      badgeType: 'danger',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: -20,
      y: 110,
      z: 15,
      sourceProvenance: 'Extracted from transaction logs & complaint narrative',
      firstSeen: '11 Jun 2026, 03:18 PM',
      lastSeen: '14 Jun 2026, 06:45 PM',
      statusText: '• MALICIOUS',
      reputation: 'Known fraudulent storefront (Threat Intelligence)',
      relatedCasesCount: 2,
      explanation: 'Counterfeit luxury electronics eCommerce portal used to lure victims. Operates spoofed checkout forms that redirect payments into mule accounts.',
      relatedItems: [
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • resolves to', badge: 'Unverified', badgeType: 'danger', iconType: 'ip' },
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • contains URL', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • shared infrastructure', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const ipNode: CorrelationGraphNode = {
      id: 'node-ip-c2',
      label: '185.220.101.44',
      sublabel: 'IP Address',
      type: 'ip',
      iconType: 'ip',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#ef4444',
      iconBg: '#371014',
      iconColor: '#ef4444',
      x: 115,
      y: 85,
      z: -10,
      sourceProvenance: 'Netflow Telemetry & DNS Resolution',
      firstSeen: '09 Jun 2026, 11:15 AM',
      lastSeen: '14 Jun 2026, 06:45 PM',
      statusText: '• UNVERIFIED',
      reputation: 'Tor Exit Node / Bulletproof Hosting C2 (Threat Intelligence)',
      relatedCasesCount: 3,
      explanation: 'Bulletproof C2 host shared by both the counterfeit shopping portal and the UPI phishing campaign. Acts as backend command proxy for DarkSynapse syndicate.',
      relatedItems: [
        { id: 'node-domain-7033', label: 'mega-deal-electronics.shop', typeDesc: 'Domain • resolves to', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • direct link', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • also used in', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const case7102Node: CorrelationGraphNode = {
      id: 'node-case-7102',
      label: 'CYBER-2026-7102',
      sublabel: 'Related Case',
      type: 'related-case',
      iconType: 'related-case',
      badge: 'Related',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: 145,
      y: -15,
      z: 10,
      sourceProvenance: 'Bangalore Cybercell docket',
      firstSeen: '12 Jun 2026, 10:24 AM',
      lastSeen: '14 Jun 2026, 11:20 PM',
      statusText: '• RELATED',
      reputation: 'Verified UPI debit fraud docket (Citizen Portal)',
      relatedCasesCount: 2,
      explanation: 'Related UPI Phishing complaint sharing the identical C2 infrastructure (185.220.101.44) and Indiranagar mule account laundering pipeline.',
      relatedItems: [
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • candidate match', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • shared C2 host', badge: 'Unverified', badgeType: 'warning', iconType: 'ip' }
      ]
    };

    const case6891Node: CorrelationGraphNode = {
      id: 'node-case-6891',
      label: 'CYBER-2026-6891',
      sublabel: 'Related Case',
      type: 'related-case',
      iconType: 'related-case',
      badge: 'Related',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: -145,
      y: 85,
      z: 20,
      sourceProvenance: 'State Cyber Cell Cross-Docket Ingest',
      firstSeen: '10 Jun 2026, 02:40 PM',
      lastSeen: '13 Jun 2026, 08:30 AM',
      statusText: '• RELATED',
      reputation: 'Electricity Bill KYC Phishing Campaign',
      relatedCasesCount: 2,
      explanation: 'Phishing campaign operating on identical bulletproof server block with correlated victim payment routing.',
      relatedItems: [
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • similar pattern', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • shared subnet', badge: 'Unverified', badgeType: 'warning', iconType: 'ip' }
      ]
    };

    const bankNode: CorrelationGraphNode = {
      id: 'node-bank-mule',
      label: 'XXXX 8821',
      sublabel: 'Bank Account',
      type: 'bank',
      iconType: 'bank',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: -15,
      y: -125,
      z: -10,
      sourceProvenance: 'Axis Bank Indiranagar Nodal Subpoena Response',
      firstSeen: '11 Jun 2026, 03:20 PM',
      lastSeen: '13 Jun 2026, 05:45 PM',
      statusText: '• UNVERIFIED',
      reputation: 'Suspected Tier-1 Mule Beneficiary Account',
      relatedCasesCount: 2,
      explanation: 'Mule account opened under fictitious KYC receiving multiple retail and UPI scam tranches before rapid ATM cash liquidation.',
      relatedItems: [
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • transaction to', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • shared mule pool', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const urlNode: CorrelationGraphNode = {
      id: 'node-url-gateway',
      label: 'payment-gateway-mimic.in',
      sublabel: 'URL',
      type: 'url',
      iconType: 'url',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#d97706',
      iconBg: '#3d2508',
      iconColor: '#d97706',
      x: 105,
      y: -105,
      z: 10,
      sourceProvenance: 'Extracted from victim browser history & payment link',
      firstSeen: '11 Jun 2026, 03:19 PM',
      lastSeen: '13 Jun 2026, 01:00 PM',
      statusText: '• UNVERIFIED',
      reputation: 'Counterfeit Payment Gateway Kit (Threat Intel)',
      relatedCasesCount: 1,
      explanation: 'Fake payment checkout page spoofing Razorpay / PayU brand identity to harvest card credentials and execute unauthorized IMPS transfers.',
      relatedItems: [
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • gateway URL', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const mobileNode: CorrelationGraphNode = {
      id: 'node-mobile-7033',
      label: '+91 98112 87654',
      sublabel: 'Mobile Number',
      type: 'mobile',
      iconType: 'mobile',
      badge: 'Verified',
      badgeType: 'success',
      glowColor: '#00e676',
      iconBg: '#052e16',
      iconColor: '#00e676',
      x: -110,
      y: -90,
      z: 20,
      sourceProvenance: 'WhatsApp merchant communication logs',
      firstSeen: '11 Jun 2026, 02:45 PM',
      lastSeen: '12 Jun 2026, 11:10 AM',
      statusText: '• VERIFIED',
      reputation: 'Verified suspect SIM (Jio Telecom Subpoena)',
      relatedCasesCount: 1,
      explanation: 'Mobile number used to communicate fake delivery tracking numbers to the victim. Traced to a fake identity Aadhaar in Jamtara, Jharkhand.',
      relatedItems: [
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • reported in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const emailNode: CorrelationGraphNode = {
      id: 'node-email-7033',
      label: 'support@mega-deal-electronics.shop',
      sublabel: 'Email Address',
      type: 'email',
      iconType: 'email',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#a855f7',
      iconBg: '#31104a',
      iconColor: '#a855f7',
      x: -140,
      y: -20,
      z: -15,
      sourceProvenance: 'Invoice email confirmation',
      firstSeen: '11 Jun 2026, 03:22 PM',
      lastSeen: '12 Jun 2026, 09:30 AM',
      statusText: '• UNVERIFIED',
      reputation: 'ProtonMail alias forwarding to scam syndicate',
      relatedCasesCount: 1,
      explanation: 'Contact email provided on forged sales receipt. MX records route to anonymous offshore email relay.',
      relatedItems: [
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Active Case • invoice contact', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const edges: CorrelationGraphEdge[] = [
      { id: 'e-7033-1', sourceId: 'node-case-7033', targetId: 'node-domain-7033', label: 'contains URL', style: 'solid-red', badgeColor: '#ef4444', verified: false },
      { id: 'e-7033-2', sourceId: 'node-domain-7033', targetId: 'node-ip-c2', label: 'resolves to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7033-3', sourceId: 'node-ip-c2', targetId: 'node-case-7102', label: 'also used in', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7033-4', sourceId: 'node-ip-c2', targetId: 'node-case-6891', label: 'shared C2 host', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7033-5', sourceId: 'node-case-7033', targetId: 'node-ip-c2', label: '', style: 'solid-green', badgeColor: '#00e676', verified: true },
      { id: 'e-7033-6', sourceId: 'node-case-7033', targetId: 'node-case-7102', label: 'similar pattern', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7033-7', sourceId: 'node-case-7033', targetId: 'node-url-gateway', label: 'mimic gateway', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7033-8', sourceId: 'node-case-7033', targetId: 'node-bank-mule', label: 'transaction to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7033-9', sourceId: 'node-case-7033', targetId: 'node-mobile-7033', label: 'reported in', style: 'solid-green', badgeColor: '#00e676', verified: true },
      { id: 'e-7033-10', sourceId: 'node-case-7033', targetId: 'node-email-7033', label: 'invoice sender', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false }
    ];

    return {
      nodes: [centerNode, domainNode, ipNode, case7102Node, case6891Node, bankNode, urlNode, mobileNode, emailNode],
      edges,
      defaultSelectedNodeId: 'node-domain-7033'
    };
  }

  // 2. CASE-6891 (CYBER-2026-6891: Electricity Bill KYC Phishing)
  if (normId === 'case-6891' || refNum === 'CYBER-2026-6891') {
    const centerNode: CorrelationGraphNode = {
      id: 'node-case-6891',
      label: 'CYBER-2026-6891',
      sublabel: 'Electricity Bill KYC Phishing',
      type: 'case',
      iconType: 'case',
      badge: 'ACTIVE CASE',
      badgeType: 'active',
      glowColor: '#00e676',
      iconBg: '#052e16',
      iconColor: '#00e676',
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
      fz: 0,
      sourceProvenance: 'Bangalore Cybercell docket & Citizen complaint (Devika Pillai)',
      firstSeen: '10 Jun 2026, 02:40 PM',
      lastSeen: '14 Jun 2026, 09:15 AM',
      statusText: '• ACTIVE CASE',
      reputation: 'Active smishing campaign targeting electricity consumers across Karnataka',
      relatedCasesCount: 3,
      explanation: 'Primary Anchor Case: Electricity Bill KYC Phishing docket sharing identical phishing URL templates and deceptive SMS lures resulting in unauthorized account debits.',
      relatedItems: [
        { id: 'node-url-kseb', label: 'electricity-power-bill-update.in', typeDesc: 'URL • contains URL', badge: 'Malicious', badgeType: 'danger', iconType: 'url' },
        { id: 'node-domain-fake', label: 'fake-bank-verify.in', typeDesc: 'Domain • shared kit', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • C2 proxy', badge: 'Unverified', badgeType: 'warning', iconType: 'ip' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • shared kit', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const urlNode: CorrelationGraphNode = {
      id: 'node-url-kseb',
      label: 'electricity-power-bill-update.in',
      sublabel: 'URL',
      type: 'url',
      iconType: 'url',
      badge: 'Malicious',
      badgeType: 'danger',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: -20,
      y: 110,
      z: 15,
      sourceProvenance: 'Phishing SMS lure message body',
      firstSeen: '10 Jun 2026, 02:40 PM',
      lastSeen: '13 Jun 2026, 08:30 AM',
      statusText: '• MALICIOUS',
      reputation: 'Known electricity utility phishing landing page (CERT-In Telemetry)',
      relatedCasesCount: 2,
      explanation: 'Phishing landing page mimicking State Electricity Board portal demanding immediate payment to avert power cut.',
      relatedItems: [
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • resolves to', badge: 'Unverified', badgeType: 'danger', iconType: 'ip' },
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • primary lure', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const domainNode: CorrelationGraphNode = {
      id: 'node-domain-fake',
      label: 'fake-bank-verify.in',
      sublabel: 'Domain',
      type: 'domain',
      iconType: 'domain',
      badge: 'Malicious',
      badgeType: 'danger',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: 105,
      y: -105,
      z: 10,
      sourceProvenance: 'Reverse DNS Telemetry',
      firstSeen: '12 Jun 2026, 09:45 AM',
      lastSeen: '14 Jun 2026, 11:20 PM',
      statusText: '• MALICIOUS',
      reputation: 'Known phishing domain (Threat Intelligence)',
      relatedCasesCount: 3,
      explanation: 'Domain hosting shared payment credential harvest scripts common to both electricity scam and UPI fraud campaigns.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • shared toolkit', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • common domain', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const ipNode: CorrelationGraphNode = {
      id: 'node-ip-c2',
      label: '185.220.101.44',
      sublabel: 'IP Address',
      type: 'ip',
      iconType: 'ip',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#ef4444',
      iconBg: '#371014',
      iconColor: '#ef4444',
      x: 115,
      y: 85,
      z: -10,
      sourceProvenance: 'DNS Resolution of phishing domain',
      firstSeen: '09 Jun 2026, 11:15 AM',
      lastSeen: '14 Jun 2026, 06:45 PM',
      statusText: '• UNVERIFIED',
      reputation: 'Tor Exit Node / Bulletproof Hosting C2 (Threat Intelligence)',
      relatedCasesCount: 3,
      explanation: 'Shared hosting infrastructure resolving both electricity utility and UPI phishing landing portals.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • hosted on', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Related Case • shared host', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const case7102Node: CorrelationGraphNode = {
      id: 'node-case-7102',
      label: 'CYBER-2026-7102',
      sublabel: 'Related Case',
      type: 'related-case',
      iconType: 'related-case',
      badge: 'Related',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: -145,
      y: 85,
      z: 20,
      sourceProvenance: 'Bangalore Cybercell docket',
      firstSeen: '12 Jun 2026, 10:24 AM',
      lastSeen: '14 Jun 2026, 11:20 PM',
      statusText: '• RELATED',
      reputation: 'UPI / QR Payment Scam',
      relatedCasesCount: 2,
      explanation: 'Correlated victim complaint sharing the identical phishing kits and payment deception mechanisms.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • kit match', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const case7033Node: CorrelationGraphNode = {
      id: 'node-case-7033',
      label: 'CYBER-2026-7033',
      sublabel: 'Related Case',
      type: 'related-case',
      iconType: 'related-case',
      badge: 'Related',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: 145,
      y: -15,
      z: 10,
      sourceProvenance: 'Delhi Cybercell docket',
      firstSeen: '11 Jun 2026, 03:18 PM',
      lastSeen: '13 Jun 2026, 05:45 PM',
      statusText: '• RELATED',
      reputation: 'Mule Account Syndicated Network',
      relatedCasesCount: 2,
      explanation: 'Syndicated mule network utilizing the same Tor C2 infrastructure (185.220.101.44) to liquidate stolen funds.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • shared C2', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const bankNode: CorrelationGraphNode = {
      id: 'node-bank-6891',
      label: 'XXXX 4321',
      sublabel: 'Bank Account',
      type: 'bank',
      iconType: 'bank',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: -15,
      y: -125,
      z: -10,
      sourceProvenance: 'Victim passbook extract',
      firstSeen: '10 Jun 2026, 02:45 PM',
      lastSeen: '10 Jun 2026, 02:46 PM',
      statusText: '• UNVERIFIED',
      reputation: 'State Bank of India Indiranagar Branch Mule Pool',
      relatedCasesCount: 1,
      explanation: 'Recipient beneficiary account debited ₹32,000 under false bill settlement pretence.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • transfer to', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const mobileNode: CorrelationGraphNode = {
      id: 'node-mobile-6891',
      label: '+91 98221 11223',
      sublabel: 'Mobile Number',
      type: 'mobile',
      iconType: 'mobile',
      badge: 'Verified',
      badgeType: 'success',
      glowColor: '#00e676',
      iconBg: '#052e16',
      iconColor: '#00e676',
      x: -110,
      y: -90,
      z: 20,
      sourceProvenance: 'Victim SMS message headers',
      firstSeen: '10 Jun 2026, 02:30 PM',
      lastSeen: '10 Jun 2026, 02:40 PM',
      statusText: '• VERIFIED',
      reputation: 'Verified SMS spoof sender (Vi Telecom CDR)',
      relatedCasesCount: 1,
      explanation: 'SMS broadcast number sending urgent electricity disconnection warnings with disguised phishing links.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • SMS sender', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const emailNode: CorrelationGraphNode = {
      id: 'node-email-6891',
      label: 'power-support@quick-bill-pay.in',
      sublabel: 'Email Address',
      type: 'email',
      iconType: 'email',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#a855f7',
      iconBg: '#31104a',
      iconColor: '#a855f7',
      x: -140,
      y: -20,
      z: -15,
      sourceProvenance: 'Fake receipt PDF metadata',
      firstSeen: '10 Jun 2026, 02:45 PM',
      lastSeen: '11 Jun 2026, 10:00 AM',
      statusText: '• UNVERIFIED',
      reputation: 'Spoofed support email on fake transaction invoice',
      relatedCasesCount: 1,
      explanation: 'Contact email listed on fraudulent receipt designed to delay victim complaint filing.',
      relatedItems: [
        { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Active Case • receipt contact', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const edges: CorrelationGraphEdge[] = [
      { id: 'e-6891-1', sourceId: 'node-case-6891', targetId: 'node-url-kseb', label: 'contains URL', style: 'solid-red', badgeColor: '#ef4444', verified: false },
      { id: 'e-6891-2', sourceId: 'node-url-kseb', targetId: 'node-ip-c2', label: 'resolves to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-6891-3', sourceId: 'node-url-kseb', targetId: 'node-domain-fake', label: 'similar kit', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-6891-4', sourceId: 'node-ip-c2', targetId: 'node-case-7033', label: 'shared C2 host', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-6891-5', sourceId: 'node-case-6891', targetId: 'node-ip-c2', label: '', style: 'solid-green', badgeColor: '#00e676', verified: true },
      { id: 'e-6891-6', sourceId: 'node-case-6891', targetId: 'node-case-7102', label: 'similar pattern', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-6891-7', sourceId: 'node-case-6891', targetId: 'node-domain-fake', label: 'shared toolkit', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-6891-8', sourceId: 'node-case-6891', targetId: 'node-bank-6891', label: 'transaction to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-6891-9', sourceId: 'node-case-6891', targetId: 'node-mobile-6891', label: 'reported in', style: 'solid-green', badgeColor: '#00e676', verified: true },
      { id: 'e-6891-10', sourceId: 'node-case-6891', targetId: 'node-email-6891', label: 'invoice sender', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false }
    ];

    return {
      nodes: [centerNode, urlNode, domainNode, ipNode, case7102Node, case7033Node, bankNode, mobileNode, emailNode],
      edges,
      defaultSelectedNodeId: 'node-url-kseb'
    };
  }

  // 3. CASE-1001 (CYBER-2026-9842: AI Voice Clone Impersonation UPI & Wire Fraud)
  if (normId === 'case-1001' || refNum === 'CYBER-2026-9842') {
    const centerNode: CorrelationGraphNode = {
      id: 'node-case-9842',
      label: 'CYBER-2026-9842',
      sublabel: 'AI Voice Clone Impersonation UPI & Wire Fraud',
      type: 'case',
      iconType: 'case',
      badge: 'ACTIVE CASE',
      badgeType: 'active',
      glowColor: '#00e676',
      iconBg: '#052e16',
      iconColor: '#00e676',
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
      fz: 0,
      sourceProvenance: 'Enclave-Alpha forensic ingest & victim complaint (Priya Sharma)',
      firstSeen: '02 Sep 2026, 02:15 PM',
      lastSeen: '03 Sep 2026, 10:15 AM',
      statusText: '• ACTIVE CASE',
      reputation: 'High-value voice synthesis wire fraud attributed to DarkSynapse Syndicate',
      relatedCasesCount: 3,
      explanation: 'Primary Anchor Case: Synthetic deepfake voice synthesis impersonation of Managing Director resulting in ₹18.5L multi-hop mule diversion and cryptocurrency mixer ingress.',
      relatedItems: [
        { id: 'node-domain-nexus', label: 'secure-nexus-auth.in', typeDesc: 'Domain • Tycoon2FA credential portal', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • Tor exit C2', badge: 'Unverified', badgeType: 'warning', iconType: 'ip' },
        { id: 'node-wallet-eth', label: '0x71C...4e89', typeDesc: 'Wallet • Tornado mixer ingress', badge: 'Malicious', badgeType: 'danger', iconType: 'bank' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Related Case • shared C2 IP', badge: 'Related', badgeType: 'info', iconType: 'related-case' }
      ]
    };

    const domainNode: CorrelationGraphNode = {
      id: 'node-domain-nexus',
      label: 'secure-nexus-auth.in',
      sublabel: 'Domain',
      type: 'domain',
      iconType: 'domain',
      badge: 'Malicious',
      badgeType: 'danger',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: -20,
      y: 110,
      z: 15,
      sourceProvenance: 'Extracted from forged invoice email headers',
      firstSeen: '02 Sep 2026, 02:20 PM',
      lastSeen: '03 Sep 2026, 08:30 AM',
      statusText: '• MALICIOUS',
      reputation: 'Reverse-proxy credential harvester kit (Tycoon2FA Phishing Campaign)',
      relatedCasesCount: 2,
      explanation: 'Corporate credential harvesting kit spoofing executive Microsoft 365 login to intercept supplier verification emails.',
      relatedItems: [
        { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • resolves to', badge: 'Unverified', badgeType: 'danger', iconType: 'ip' },
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • contains URL', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const ipNode: CorrelationGraphNode = {
      id: 'node-ip-c2',
      label: '185.220.101.44',
      sublabel: 'IP Address',
      type: 'ip',
      iconType: 'ip',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#ef4444',
      iconBg: '#371014',
      iconColor: '#ef4444',
      x: 115,
      y: 85,
      z: -10,
      sourceProvenance: 'Tor exit node telemetry match',
      firstSeen: '09 Jun 2026, 11:15 AM',
      lastSeen: '03 Sep 2026, 10:15 AM',
      statusText: '• UNVERIFIED',
      reputation: 'Tor Exit Node / Bulletproof Hosting C2 (Threat Intelligence)',
      relatedCasesCount: 3,
      explanation: 'Command server utilized to dispatch spoofed emails and coordinate fraudulent banking transfers.',
      relatedItems: [
        { id: 'node-domain-nexus', label: 'secure-nexus-auth.in', typeDesc: 'Domain • resolves to', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • direct link', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const walletNode: CorrelationGraphNode = {
      id: 'node-wallet-eth',
      label: '0x71C...4e89',
      sublabel: 'Crypto Wallet',
      type: 'bank',
      iconType: 'bank',
      badge: 'Malicious',
      badgeType: 'danger',
      glowColor: '#ef4444',
      iconBg: '#371014',
      iconColor: '#ef4444',
      x: -15,
      y: -125,
      z: -10,
      sourceProvenance: 'On-chain forensic trace (Sovereign Crypto Trace Mesh)',
      firstSeen: '02 Sep 2026, 04:30 PM',
      lastSeen: '03 Sep 2026, 10:00 AM',
      statusText: '• MALICIOUS',
      reputation: 'Lazarus / DarkSynapse multi-hop mixer ingress contract',
      relatedCasesCount: 2,
      explanation: 'Mixer contract on Ethereum mainnet that absorbed ₹12L equivalent USDC before tumbling.',
      relatedItems: [
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • mixer ingress', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const case7102Node: CorrelationGraphNode = {
      id: 'node-case-7102',
      label: 'CYBER-2026-7102',
      sublabel: 'Related Case',
      type: 'related-case',
      iconType: 'related-case',
      badge: 'Related',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: 145,
      y: -15,
      z: 10,
      sourceProvenance: 'Bangalore Cybercell docket',
      firstSeen: '12 Jun 2026, 10:24 AM',
      lastSeen: '14 Jun 2026, 11:20 PM',
      statusText: '• RELATED',
      reputation: 'UPI / QR Payment Scam',
      relatedCasesCount: 2,
      explanation: 'Shared C2 IP node 185.220.101.44 and DarkSynapse laundering pipeline.',
      relatedItems: [
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • C2 correlation', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const case7033Node: CorrelationGraphNode = {
      id: 'node-case-7033',
      label: 'CYBER-2026-7033',
      sublabel: 'Related Case',
      type: 'related-case',
      iconType: 'related-case',
      badge: 'Related',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: -145,
      y: 85,
      z: 20,
      sourceProvenance: 'Delhi Cybercell docket',
      firstSeen: '11 Jun 2026, 03:18 PM',
      lastSeen: '13 Jun 2026, 05:45 PM',
      statusText: '• RELATED',
      reputation: 'Mule Account Syndicated Network',
      relatedCasesCount: 2,
      explanation: 'Mule account laundering syndicate linked to the same financial routing networks.',
      relatedItems: [
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • syndicate match', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const bankNode: CorrelationGraphNode = {
      id: 'node-bank-hdfc',
      label: 'HDFC XXXX 1092',
      sublabel: 'Bank Account',
      type: 'bank',
      iconType: 'bank',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: 105,
      y: -105,
      z: 10,
      sourceProvenance: 'I4C / 1930 Emergency Freeze Dispatch',
      firstSeen: '02 Sep 2026, 04:30 PM',
      lastSeen: '02 Sep 2026, 05:45 PM',
      statusText: '• UNVERIFIED',
      reputation: 'Mule account under Section 102 CrPC debit block',
      relatedCasesCount: 1,
      explanation: 'Recipient account into which initial ₹18.5L wire was executed before emergency freeze intervention.',
      relatedItems: [
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • frozen beneficiary', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const mobileNode: CorrelationGraphNode = {
      id: 'node-mobile-9842',
      label: '+91 98112 34567',
      sublabel: 'Mobile Number',
      type: 'mobile',
      iconType: 'mobile',
      badge: 'Verified',
      badgeType: 'success',
      glowColor: '#00e676',
      iconBg: '#052e16',
      iconColor: '#00e676',
      x: -110,
      y: -90,
      z: 20,
      sourceProvenance: 'Airtel CDR and SIP trunk signaling telemetry',
      firstSeen: '02 Sep 2026, 02:15 PM',
      lastSeen: '02 Sep 2026, 02:22 PM',
      statusText: '• VERIFIED',
      reputation: 'Deepfake VoIP gateway origin',
      relatedCasesCount: 1,
      explanation: 'Virtual number routing synthetic voice call from offshore Asterisk SIP server.',
      relatedItems: [
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • call origin', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const emailNode: CorrelationGraphNode = {
      id: 'node-email-9842',
      label: 'finance-verify@secure-nexus-auth.in',
      sublabel: 'Email Address',
      type: 'email',
      iconType: 'email',
      badge: 'Unverified',
      badgeType: 'warning',
      glowColor: '#a855f7',
      iconBg: '#31104a',
      iconColor: '#a855f7',
      x: -140,
      y: -20,
      z: -15,
      sourceProvenance: 'Forged invoice remittance message',
      firstSeen: '02 Sep 2026, 02:25 PM',
      lastSeen: '02 Sep 2026, 03:00 PM',
      statusText: '• UNVERIFIED',
      reputation: 'Spoofed vendor finance alias',
      relatedCasesCount: 1,
      explanation: 'Email sending forged supplier wire instructions following the audio call confirmation.',
      relatedItems: [
        { id: 'node-case-9842', label: 'CYBER-2026-9842', typeDesc: 'Active Case • wire instructions', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    const edges: CorrelationGraphEdge[] = [
      { id: 'e-9842-1', sourceId: 'node-case-9842', targetId: 'node-domain-nexus', label: 'contains URL', style: 'solid-red', badgeColor: '#ef4444', verified: false },
      { id: 'e-9842-2', sourceId: 'node-domain-nexus', targetId: 'node-ip-c2', label: 'resolves to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-9842-3', sourceId: 'node-ip-c2', targetId: 'node-case-7102', label: 'also used in', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-9842-4', sourceId: 'node-case-9842', targetId: 'node-case-7033', label: 'syndicate match', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-9842-5', sourceId: 'node-case-9842', targetId: 'node-ip-c2', label: '', style: 'solid-green', badgeColor: '#00e676', verified: true },
      { id: 'e-9842-6', sourceId: 'node-case-9842', targetId: 'node-case-7102', label: 'similar pattern', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-9842-7', sourceId: 'node-case-9842', targetId: 'node-wallet-eth', label: 'mixer ingress', style: 'solid-red', badgeColor: '#ef4444', verified: false },
      { id: 'e-9842-8', sourceId: 'node-case-9842', targetId: 'node-bank-hdfc', label: 'wire transfer', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-9842-9', sourceId: 'node-case-9842', targetId: 'node-mobile-9842', label: 'voice call', style: 'solid-green', badgeColor: '#00e676', verified: true },
      { id: 'e-9842-10', sourceId: 'node-case-9842', targetId: 'node-email-9842', label: 'invoice sender', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false }
    ];

    return {
      nodes: [centerNode, domainNode, ipNode, walletNode, case7102Node, case7033Node, bankNode, mobileNode, emailNode],
      edges,
      defaultSelectedNodeId: 'node-domain-nexus'
    };
  }

  // 4. CASE-7102 (Default / UPI Payment Scam Report)
  const center7102: CorrelationGraphNode = {
    id: 'node-case-7102',
    label: 'CYBER-2026-7102',
    sublabel: 'UPI / QR Payment Scam',
    type: 'case',
    iconType: 'case',
    badge: 'ACTIVE CASE',
    badgeType: 'active',
    glowColor: '#00e676',
    iconBg: '#052e16',
    iconColor: '#00e676',
    x: 0,
    y: 0,
    z: 0,
    fx: 0,
    fy: 0,
    fz: 0,
    sourceProvenance: 'Citizen complaint narrative & UPI statement',
    firstSeen: '12 Jun 2026, 10:24 AM',
    lastSeen: '14 Jun 2026, 11:20 PM',
    statusText: '• ACTIVE CASE',
    reputation: 'Verified victim complaint (Citizen Portal)',
    relatedCasesCount: 2,
    explanation: 'Primary Anchor Case: UPI debit fraud reported by victim Naveen following OTP phishing deception.',
    relatedItems: [
      { id: 'node-domain-fake', label: 'fake-bank-verify.in', typeDesc: 'Domain • contains URL', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
      { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • direct connection', badge: 'Unverified', badgeType: 'warning', iconType: 'ip' },
      { id: 'node-mobile-suspect', label: '+91 98765 43210', typeDesc: 'Mobile • reported in', badge: 'Verified', badgeType: 'success', iconType: 'mobile' },
      { id: 'node-bank-acct', label: 'XXXX 6789', typeDesc: 'Bank Account • transaction to', badge: 'Unverified', badgeType: 'warning', iconType: 'bank' }
    ]
  };

  const domain7102: CorrelationGraphNode = {
    id: 'node-domain-fake',
    label: 'fake-bank-verify.in',
    sublabel: 'Domain',
    type: 'domain',
    iconType: 'domain',
    badge: 'Malicious',
    badgeType: 'danger',
    glowColor: '#f59e0b',
    iconBg: '#38250b',
    iconColor: '#f59e0b',
    x: -20,
    y: 110,
    z: 15,
    sourceProvenance: 'Extracted from complaint narrative',
    firstSeen: '12 Jun 2026, 09:45 AM',
    lastSeen: '14 Jun 2026, 11:20 PM',
    statusText: '• MALICIOUS',
    reputation: 'Known phishing domain (Threat Intelligence)',
    relatedCasesCount: 2,
    explanation: 'This domain is reported in the current case and also appears in 2 other complaints. It is flagged as malicious by multiple threat intelligence sources.',
    relatedItems: [
      { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • resolves to', badge: 'Unverified', badgeType: 'danger', iconType: 'ip' },
      { id: 'node-case-6891', label: 'CYBER-2026-6891', typeDesc: 'Related Case • similar URL', badge: 'Related', badgeType: 'info', iconType: 'related-case' },
      { id: 'node-url-upi', label: 'upi-claim-support.in', typeDesc: 'URL • similar domain', badge: 'Unverified', badgeType: 'warning', iconType: 'url' },
      { id: 'node-email-fraud', label: 'fraud@okaxis.com', typeDesc: 'Email • mentioned in', badge: 'Unverified', badgeType: 'warning', iconType: 'email' }
    ]
  };

  const ip7102: CorrelationGraphNode = {
    id: 'node-ip-c2',
    label: '185.220.101.44',
    sublabel: 'IP Address',
    type: 'ip',
    iconType: 'ip',
    badge: 'Unverified',
    badgeType: 'warning',
    glowColor: '#ef4444',
    iconBg: '#371014',
    iconColor: '#ef4444',
    x: 115,
    y: 85,
    z: -10,
    sourceProvenance: 'Extracted from complaint narrative (AI NER)',
    firstSeen: '12 Jun 2026, 10:24 AM',
    lastSeen: '13 Jun 2026, 03:15 PM',
    statusText: '• UNVERIFIED',
    reputation: 'Tor Exit Node / Bulletproof Hosting C2 (Threat Intelligence)',
    relatedCasesCount: 2,
    explanation: 'This IP address appears in information associated with multiple cases. Because it may be shared hosting infrastructure, further verification is needed before the cases can be treated as related.',
    relatedItems: [
      { id: 'node-domain-fake', label: 'fake-bank-verify.in', typeDesc: 'Domain • resolves to', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
      { id: 'node-case-7033', label: 'CYBER-2026-7033', typeDesc: 'Related Case • also used in', badge: 'Related', badgeType: 'info', iconType: 'related-case' },
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • direct link', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const case6891_for7102: CorrelationGraphNode = {
    id: 'node-case-6891',
    label: 'CYBER-2026-6891',
    sublabel: 'Related Case',
    type: 'related-case',
    iconType: 'related-case',
    badge: 'Related',
    badgeType: 'info',
    glowColor: '#0284c7',
    iconBg: '#082f49',
    iconColor: '#38bdf8',
    x: -145,
    y: 85,
    z: 20,
    sourceProvenance: 'Bangalore Cybercell docket',
    firstSeen: '10 Jun 2026, 02:40 PM',
    lastSeen: '13 Jun 2026, 08:30 AM',
    statusText: '• RELATED',
    reputation: 'Reported scam campaign (National Cyber Crime Portal)',
    relatedCasesCount: 3,
    explanation: 'Electricity Bill KYC Phishing docket sharing identical phishing URL templates and deceptive SMS lures.',
    relatedItems: [
      { id: 'node-domain-fake', label: 'fake-bank-verify.in', typeDesc: 'Domain • similar URL', badge: 'Malicious', badgeType: 'danger', iconType: 'domain' },
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • candidate match', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const case7033_for7102: CorrelationGraphNode = {
    id: 'node-case-7033',
    label: 'CYBER-2026-7033',
    sublabel: 'Related Case',
    type: 'related-case',
    iconType: 'related-case',
    badge: 'Related',
    badgeType: 'info',
    glowColor: '#0284c7',
    iconBg: '#082f49',
    iconColor: '#38bdf8',
    x: 145,
    y: -10,
    z: 10,
    sourceProvenance: 'Delhi Cybercell docket',
    firstSeen: '09 Jun 2026, 11:15 AM',
    lastSeen: '13 Jun 2026, 05:45 PM',
    statusText: '• RELATED',
    reputation: 'Suspected syndicated mule network',
    relatedCasesCount: 2,
    explanation: 'Mule account network docket with shared IP infrastructure and matching victim communication patterns.',
    relatedItems: [
      { id: 'node-ip-c2', label: '185.220.101.44', typeDesc: 'IP Address • also used in', badge: 'Unverified', badgeType: 'warning', iconType: 'ip' },
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • similar pattern', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const email7102: CorrelationGraphNode = {
    id: 'node-email-fraud',
    label: 'fraud@okaxis.com',
    sublabel: 'Email Address',
    type: 'email',
    iconType: 'email',
    badge: 'Unverified',
    badgeType: 'warning',
    glowColor: '#a855f7',
    iconBg: '#31104a',
    iconColor: '#a855f7',
    x: -140,
    y: -20,
    z: -15,
    sourceProvenance: 'Phishing SMS lure text',
    firstSeen: '12 Jun 2026, 10:24 AM',
    lastSeen: '13 Jun 2026, 09:15 AM',
    statusText: '• UNVERIFIED',
    reputation: 'Corresponds with Axis Bank Indiranagar mule account',
    relatedCasesCount: 1,
    explanation: 'Beneficiary handle reported in scam message. Corresponds with Axis Bank Indiranagar mule account.',
    relatedItems: [
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • mentioned in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const mobile7102: CorrelationGraphNode = {
    id: 'node-mobile-suspect',
    label: '+91 98765 43210',
    sublabel: 'Mobile Number',
    type: 'mobile',
    iconType: 'mobile',
    badge: 'Verified',
    badgeType: 'success',
    glowColor: '#00e676',
    iconBg: '#052e16',
    iconColor: '#00e676',
    x: -110,
    y: -90,
    z: 20,
    sourceProvenance: 'Victim phone call logs (Airtel Karnataka)',
    firstSeen: '12 Jun 2026, 10:20 AM',
    lastSeen: '12 Jun 2026, 10:24 AM',
    statusText: '• VERIFIED',
    reputation: 'Verified suspect caller number (CDR Record)',
    relatedCasesCount: 1,
    explanation: 'Suspect caller number posing as bank anti-fraud executive. Verified carrier subscription and cell tower CDR.',
    relatedItems: [
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • reported in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const bank7102: CorrelationGraphNode = {
    id: 'node-bank-acct',
    label: 'XXXX 6789',
    sublabel: 'Bank Account',
    type: 'bank',
    iconType: 'bank',
    badge: 'Unverified',
    badgeType: 'warning',
    glowColor: '#f59e0b',
    iconBg: '#38250b',
    iconColor: '#f59e0b',
    x: -15,
    y: -125,
    z: -10,
    sourceProvenance: 'Victim Bank Statement Extract',
    firstSeen: '12 Jun 2026, 10:24 AM',
    lastSeen: '12 Jun 2026, 10:25 AM',
    statusText: '• UNVERIFIED',
    reputation: 'Axis Bank recipient account (IMPS Debit)',
    relatedCasesCount: 1,
    explanation: 'Recipient bank account debited of ₹25,000 via fraudulent IMPS transfer.',
    relatedItems: [
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • transaction to', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const url7102: CorrelationGraphNode = {
    id: 'node-url-upi',
    label: 'upi-claim-support.in',
    sublabel: 'URL',
    type: 'url',
    iconType: 'url',
    badge: 'Unverified',
    badgeType: 'warning',
    glowColor: '#d97706',
    iconBg: '#3d2508',
    iconColor: '#d97706',
    x: 105,
    y: -105,
    z: 10,
    sourceProvenance: 'SOC Perimeter Threat Telemetry Match',
    firstSeen: '11 Jun 2026, 08:15 PM',
    lastSeen: '13 Jun 2026, 09:00 AM',
    statusText: '• UNVERIFIED',
    reputation: 'Suspected phishing claim portal (SOC Telemetry)',
    relatedCasesCount: 1,
    explanation: 'Secondary phishing landing page discovered in telemetry simulating NPCI compensation claim portal.',
    relatedItems: [
      { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • similar domain', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const edges7102: CorrelationGraphEdge[] = [
    { id: 'edge-1', sourceId: 'node-case-7102', targetId: 'node-domain-fake', label: 'contains URL', style: 'solid-red', badgeColor: '#ef4444', verified: false },
    { id: 'edge-2', sourceId: 'node-domain-fake', targetId: 'node-ip-c2', label: 'resolves to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'edge-3', sourceId: 'node-domain-fake', targetId: 'node-case-6891', label: 'similar URL', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'edge-4', sourceId: 'node-ip-c2', targetId: 'node-case-7033', label: 'also used in', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'edge-5', sourceId: 'node-case-7102', targetId: 'node-ip-c2', label: '', style: 'solid-green', badgeColor: '#00e676', verified: true },
    { id: 'edge-6', sourceId: 'node-case-7102', targetId: 'node-case-7033', label: 'similar pattern', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'edge-7', sourceId: 'node-case-7102', targetId: 'node-url-upi', label: 'similar domain', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'edge-8', sourceId: 'node-case-7102', targetId: 'node-bank-acct', label: 'transaction to', style: 'solid-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'edge-9', sourceId: 'node-case-7102', targetId: 'node-mobile-suspect', label: 'reported in', style: 'solid-green', badgeColor: '#00e676', verified: true },
    { id: 'edge-10', sourceId: 'node-case-7102', targetId: 'node-email-fraud', label: 'mentioned in', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false }
  ];

  return {
    nodes: [center7102, domain7102, ip7102, case6891_for7102, case7033_for7102, email7102, mobile7102, bank7102, url7102],
    edges: edges7102,
    defaultSelectedNodeId: 'node-domain-fake'
  };
}

export const CrossCaseCorrelationPortalView: React.FC<CrossCaseCorrelationPortalViewProps> = ({
  onSelectTab,
  onSelectCase,
  complaints = [],
  selectedCaseId
}) => {
  const availableComplaints = useMemo(() => {
    return complaints && complaints.length > 0 ? complaints : INITIAL_COMPLAINTS;
  }, [complaints]);

  // Active Case Selector - initializes with selectedCaseId or first complaint
  const [activeCaseId, setActiveCaseId] = useState<string>(
    selectedCaseId || availableComplaints[0]?.id || 'case-7102'
  );

  // Synchronize when parent passes a new selectedCaseId
  useEffect(() => {
    if (selectedCaseId) {
      const match = availableComplaints.find(
        c => c.id === selectedCaseId || c.referenceNumber.toLowerCase() === selectedCaseId.toLowerCase()
      );
      if (match && match.id !== activeCaseId) {
        setActiveCaseId(match.id);
      }
    }
  }, [selectedCaseId, availableComplaints]);

  // Dynamically derive graph nodes and edges for the active case
  const currentGraph = useMemo(() => {
    return buildCorrelationGraphForCase(activeCaseId, availableComplaints);
  }, [activeCaseId, availableComplaints]);

  const nodes = currentGraph.nodes;
  const edges = currentGraph.edges;

  // Selected Node in the right inspector
  const [selectedNodeId, setSelectedNodeId] = useState<string>(currentGraph.defaultSelectedNodeId);

  // Whenever active case changes, re-anchor inspector to default node of that case
  useEffect(() => {
    setSelectedNodeId(currentGraph.defaultSelectedNodeId);
    if (fgRef.current) {
      fgRef.current.cameraPosition({ x: 0, y: 70, z: 275 }, { x: 0, y: 0, z: 0 }, 900);
    }
  }, [activeCaseId, currentGraph.defaultSelectedNodeId]);

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 3D Canvas Refs & Dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const fgRef = useRef<ForceGraphMethods>();
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 920, height: 680 });
  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [hoveredNode, setHoveredNode] = useState<any>(null);

  // Responsive container observer
  useEffect(() => {
    if (!containerRef.current) return;
    const updateDims = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth || 920,
          height: clientHeight || 680
        });
      }
    };
    updateDims();
    const observer = new ResizeObserver(updateDims);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // 360-degree auto rotation & smooth damping
  useEffect(() => {
    if (!fgRef.current) return;
    const controls = (fgRef.current as any).controls?.();
    if (controls) {
      controls.autoRotate = isAutoRotate;
      controls.autoRotateSpeed = 0.85;
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
    }
  }, [isAutoRotate]);

  // Initial camera orientation and holographic floor grid setup
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force('charge')?.strength(-800);
    fgRef.current.d3Force('link')?.distance(145);
    if ((fgRef.current as any).d3VelocityDecay) {
      (fgRef.current as any).d3VelocityDecay(0.28);
    }

    // Add cyber holographic floor grid and concentric distance rings to Three.js scene
    const scene = (fgRef.current as any).scene?.();
    if (scene && !scene.userData.hasCyberGrid) {
      scene.userData.hasCyberGrid = true;
      
      // Cyber ground grid
      const gridHelper = new THREE.GridHelper(520, 26, 0x00e676, 0x072414);
      gridHelper.position.y = -8;
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = 0.22;
      scene.add(gridHelper);

      // Concentric radar rings on floor
      const ringRadii = [60, 110, 160, 210, 260];
      ringRadii.forEach(r => {
        const ringGeo = new THREE.RingGeometry(r, r + 0.8, 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00e676,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.14
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -7.8;
        scene.add(ring);
      });
    }

    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.cameraPosition({ x: 0, y: 70, z: 275 }, { x: 0, y: 0, z: 0 }, 1000);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Camera toolbar actions
  const handleResetCamera = () => {
    if (!fgRef.current) return;
    fgRef.current.cameraPosition({ x: 0, y: 70, z: 275 }, { x: 0, y: 0, z: 0 }, 900);
    showToast('Camera reset to default 3D perspective.');
  };

  const handleFitGraph = () => {
    if (!fgRef.current) return;
    fgRef.current.zoomToFit(800, 45);
    showToast('Fitted all nodes to viewport bounds.');
  };

  const handleZoom = () => {
    if (!fgRef.current) return;
    const camera = (fgRef.current as any).camera?.();
    if (camera && camera.position) {
      fgRef.current.cameraPosition(
        { x: camera.position.x * 0.78, y: camera.position.y * 0.78, z: camera.position.z * 0.78 },
        undefined,
        600
      );
      showToast('Zoomed in.');
    }
  };

  const handlePan = () => {
    showToast('Hold right-click or use arrow keys to pan.');
  };

  const handleNodeClick = (node: any) => {
    setSelectedNodeId(node.id);
    if (fgRef.current && node.x !== undefined && node.y !== undefined && node.z !== undefined) {
      const distance = 105;
      const distRatio = 1 + distance / Math.hypot(node.x, node.y, node.z || 1);
      fgRef.current.cameraPosition(
        {
          x: node.x * distRatio,
          y: node.y * distRatio + 15,
          z: (node.z || 0) * distRatio
        },
        node,
        1000
      );
    }
  };

  // Toast feedback
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
    showToast(`Copied "${text}" to clipboard.`);
  };

  // Selected Node lookup (defaults to fake-bank-verify.in)
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId) || nodes[1];
  }, [selectedNodeId, nodes]);

  // 3D Graph Data
  const graphData3D = useMemo(() => {
    return {
      nodes: nodes.map(n => ({ ...n })),
      links: edges.map(e => ({
        source: e.sourceId,
        target: e.targetId,
        label: e.label,
        style: e.style,
        badgeColor: e.badgeColor,
        verified: e.verified
      }))
    };
  }, [nodes, edges]);

  // Helper: Draw icon to canvas texture for 3D sprite billboard
  const createIconTexture = (iconType: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Glowing circle backing
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(7, 24, 15, 0.9)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.stroke();

    // Stylized Icon Glyphs
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (iconType === 'case') {
      // Folder
      ctx.beginPath();
      ctx.rect(36, 44, 56, 42);
      ctx.stroke();
      ctx.beginPath();
      ctx.rect(36, 36, 26, 12);
      ctx.stroke();
    } else if (iconType === 'domain') {
      // Globe
      ctx.beginPath();
      ctx.arc(64, 64, 28, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(64, 64, 13, 28, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(36, 64);
      ctx.lineTo(92, 64);
      ctx.stroke();
    } else if (iconType === 'ip') {
      // Server / Lock / Pin
      ctx.beginPath();
      ctx.rect(42, 52, 44, 38);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 46, 16, Math.PI, 0);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 68, 4, 0, 2 * Math.PI);
      ctx.fill();
    } else if (iconType === 'related-case') {
      // Document
      ctx.beginPath();
      ctx.rect(40, 34, 48, 60);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, 50);
      ctx.lineTo(80, 50);
      ctx.moveTo(48, 64);
      ctx.lineTo(80, 64);
      ctx.moveTo(48, 78);
      ctx.lineTo(72, 78);
      ctx.stroke();
    } else if (iconType === 'email') {
      // Mail
      ctx.beginPath();
      ctx.rect(36, 42, 56, 44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(36, 44);
      ctx.lineTo(64, 66);
      ctx.lineTo(92, 44);
      ctx.stroke();
    } else if (iconType === 'mobile') {
      // Phone
      ctx.beginPath();
      ctx.rect(44, 32, 40, 64);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 86, 3, 0, 2 * Math.PI);
      ctx.fill();
    } else if (iconType === 'bank') {
      // Columns / Landmark
      ctx.beginPath();
      ctx.moveTo(36, 44);
      ctx.lineTo(64, 32);
      ctx.lineTo(92, 44);
      ctx.closePath();
      ctx.stroke();
      ctx.rect(42, 48, 8, 36);
      ctx.rect(58, 48, 8, 36);
      ctx.rect(74, 48, 8, 36);
      ctx.stroke();
      ctx.fillRect(34, 86, 60, 6);
    } else if (iconType === 'url') {
      // Link Chain
      ctx.beginPath();
      ctx.arc(52, 64, 14, Math.PI * 0.75, Math.PI * 1.75);
      ctx.arc(76, 64, 14, Math.PI * 1.75, Math.PI * 0.75);
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  };

  // 3D Holographic Pedestal & Billboard Node Renderer
  const nodeThreeObject = useCallback((node: any) => {
    const isSelected = node.id === selectedNodeId;
    const isHovered = node.id === hoveredNode?.id;
    const isCenter = node.badge === 'ACTIVE CASE' || node.type === 'case' || node.id === `node-${activeCaseId}`;

    const group = new THREE.Group();
    const radius = isCenter ? 14 : 9;
    const glowColor = node.glowColor || '#00e676';

    // 1. Concentric Holographic Ground Rings (horizontal flat plane)
    const ringMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isSelected ? 0.95 : (isHovered ? 0.8 : 0.6)
    });

    const ring1 = new THREE.Mesh(new THREE.RingGeometry(radius * 1.25, radius * 1.38, 36), ringMat);
    ring1.rotation.x = Math.PI / 2;
    group.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.RingGeometry(radius * 1.6, radius * 1.72, 36), ringMat);
    ring2.rotation.x = Math.PI / 2;
    group.add(ring2);

    if (isCenter || isSelected) {
      const ring3 = new THREE.Mesh(new THREE.RingGeometry(radius * 2.05, radius * 2.18, 36), ringMat);
      ring3.rotation.x = Math.PI / 2;
      group.add(ring3);
    }

    // 2. Glowing Base Pedestal Cylinder
    const cylGeo = new THREE.CylinderGeometry(radius * 0.95, radius * 1.08, 2.2, 36);
    const cylMat = new THREE.MeshStandardMaterial({
      color: 0x051a10,
      emissive: glowColor,
      emissiveIntensity: isSelected ? 0.85 : 0.45,
      roughness: 0.25,
      metalness: 0.65
    });
    const cyl = new THREE.Mesh(cylGeo, cylMat);
    cyl.position.y = 1.1;
    group.add(cyl);

    // 3. Central Glowing Icon Sphere
    const orbGeo = new THREE.SphereGeometry(radius * 0.65, 32, 32);
    const orbMat = new THREE.MeshStandardMaterial({
      color: glowColor,
      emissive: glowColor,
      emissiveIntensity: isSelected ? 0.9 : 0.5,
      roughness: 0.15,
      metalness: 0.4
    });
    const orb = new THREE.Mesh(orbGeo, orbMat);
    orb.position.y = 5.2;
    group.add(orb);

    // 4. Camera-Facing Sprite with Node Icon
    const tex = createIconTexture(node.iconType, glowColor);
    if (tex) {
      const iconSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      iconSprite.position.set(0, 5.2, 0);
      const iconScale = radius * 1.45;
      iconSprite.scale.set(iconScale, iconScale, 1);
      group.add(iconSprite);
    }

    // 5. Camera-Facing SpriteText Label (Clean typography, zero collisions)
    let labelText = '';
    if (isCenter) {
      labelText = `${node.label}\n${node.sublabel}\n[${node.badge}]`;
    } else {
      labelText = `${node.label}\n${node.sublabel ? node.sublabel + '\n' : ''}[${node.badge}]`;
    }

    const sprite = new SpriteText(labelText);
    sprite.color = isSelected ? '#FFFFFF' : '#E2E8F0';
    sprite.textHeight = isCenter ? 4.2 : 3.6;
    sprite.position.set(0, -radius - 4.5, 0);
    sprite.fontFace = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    sprite.fontWeight = 'bold';
    sprite.backgroundColor = 'rgba(5, 17, 10, 0.92)';
    sprite.borderColor = isSelected ? '#00e676' : glowColor;
    sprite.borderWidth = isSelected ? 1.2 : 0.7;
    sprite.borderRadius = 4;
    sprite.padding = [2.5, 5];
    group.add(sprite);

    return group;
  }, [selectedNodeId, hoveredNode]);

  // Floating Edge Badge Pill Renderer (`linkThreeObject`)
  const linkThreeObject = useCallback((link: any): THREE.Object3D => {
    if (!link.label) return new THREE.Object3D();
    const sprite = new SpriteText(link.label);
    sprite.color = '#FFFFFF';
    sprite.textHeight = 3.2;
    sprite.fontFace = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    sprite.fontWeight = 'bold';
    sprite.backgroundColor = link.style === 'solid-red' ? 'rgba(90, 12, 18, 0.95)' : 'rgba(9, 24, 15, 0.95)';
    sprite.borderColor = link.badgeColor || (link.style === 'solid-red' ? '#ef4444' : '#f59e0b');
    sprite.borderWidth = 0.8;
    sprite.borderRadius = 3.5;
    sprite.padding = [1.8, 4.5];
    return sprite as unknown as THREE.Object3D;
  }, []);

  const linkPositionUpdate = useCallback((sprite: any, { start, end }: any) => {
    if (!sprite || !start || !end) return;
    sprite.position.set(
      (start.x + end.x) / 2,
      (start.y + end.y) / 2 + 1.2,
      (start.z + end.z) / 2
    );
  }, []);

  const getLinkColor = useCallback((link: any) => {
    if (link.style === 'solid-green' || link.verified) return '#00e676';
    if (link.style === 'solid-red') return '#ef4444';
    return '#f59e0b';
  }, []);

  const getLinkWidth = useCallback((link: any) => {
    if (link.style === 'solid-green' || link.verified) return 2.6;
    if (link.style === 'solid-red') return 2.4;
    return 1.8;
  }, []);

  return (
    <div className="flex flex-col gap-3 text-content-primary animate-in fade-in duration-200">
      {/* Toast Alert Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#06140c] border border-primary text-primary text-xs font-mono shadow-2xl animate-in slide-in-from-bottom-3">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Strip: Icon, Title, Subtitle & Active Case Dropdown */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-0.5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00e676]/10 border border-[#00e676]/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,230,118,0.2)]">
            <Share2 className="w-5 h-5 text-[#00e676]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Cross-Case Correlation
            </h1>
            <p className="text-xs text-content-muted font-sans mt-0.5">
              3D investigation graph showing relationships between cases, indicators and intelligence sources.
            </p>
          </div>
        </div>

        {/* Active-Case Selector Dropdown matching screenshot */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className="text-xs text-content-muted">Active Case:</span>
          <div className="relative">
            <select
              value={activeCaseId}
              onChange={(e) => {
                const newId = e.target.value;
                setActiveCaseId(newId);
                onSelectCase?.(newId);
                const found = availableComplaints.find(c => c.id === newId || c.referenceNumber === newId);
                showToast(`Switched active graph anchor to ${found?.referenceNumber || newId.toUpperCase()}`);
              }}
              className="appearance-none bg-[#05140b] border border-white/10 hover:border-primary/50 rounded-xl pl-3.5 pr-8 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary cursor-pointer shadow-md"
            >
              {availableComplaints.map(c => (
                <option key={c.id} value={c.id}>
                  {c.referenceNumber} — {c.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-content-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Main Grid: Left 3D Canvas + Right Node Details Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* ========================================================================= */}
        {/* LEFT 3D GRAPH CANVAS (8.5 Columns)                                        */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3">
          <div
            ref={containerRef}
            className="relative w-full h-[680px] rounded-2xl bg-[#030906] border border-primary/20 overflow-hidden shadow-2xl flex flex-col justify-between select-none"
          >
            {/* Cyber Grid Background */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-25 z-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 230, 118, 0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 230, 118, 0.1) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />

            {/* WebGL 3D Force Directed Graph */}
            <ForceGraph3D
              ref={fgRef as any}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData3D}
              backgroundColor="#030906"
              nodeThreeObject={nodeThreeObject}
              nodeLabel={() => ''}
              onNodeClick={(node: any) => handleNodeClick(node)}
              onNodeHover={(node: any) => setHoveredNode(node || null)}
              linkColor={getLinkColor}
              linkWidth={getLinkWidth}
              linkOpacity={0.8}
              linkCurvature={0.06}
              linkDirectionalParticles={2}
              linkDirectionalParticleWidth={2.4}
              linkDirectionalParticleSpeed={0.006}
              linkDirectionalParticleColor={getLinkColor}
              linkThreeObjectExtend={true}
              linkThreeObject={linkThreeObject}
              linkPositionUpdate={linkPositionUpdate}
              enableNodeDrag={true}
              showNavInfo={false}
            />

            {/* Bottom Overlay Row: Legend (Left), Floating Controls (Center), Mini-Map (Right) */}
            <div className="relative z-10 w-full p-4 flex items-end justify-between gap-3 pointer-events-none">
              
              {/* Bottom-Left Legend matching screenshot */}
              <div className="pointer-events-auto bg-[#041109]/90 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-2 font-mono text-[11px] min-w-[190px]">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-[3px] bg-[#00e676] rounded-full shadow-[0_0_8px_#00e676]" />
                  <span className="text-white text-xs">Verified Relationship</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 border-t-2 border-dashed border-[#f59e0b]" />
                  <span className="text-white text-xs">Unverified Relationship</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-[3px] bg-[#ef4444] rounded-full shadow-[0_0_8px_#ef4444]" />
                  <span className="text-white text-xs">Malicious Indicator</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 border-t-2 border-dashed border-[#64748b]" />
                  <span className="text-white text-xs">Informational Link</span>
                </div>
              </div>

              {/* Bottom-Center Floating Pill Toolbar matching screenshot */}
              <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#041209]/95 backdrop-blur-md border border-white/15 shadow-2xl font-mono text-xs text-content-secondary">
                {/* Rotate button with toggle */}
                <button
                  onClick={() => {
                    setIsAutoRotate(prev => !prev);
                    showToast(isAutoRotate ? 'Paused 360° rotation.' : 'Resumed 360° rotation.');
                  }}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                    isAutoRotate
                      ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/50 font-bold shadow-[0_0_10px_rgba(0,230,118,0.2)]'
                      : 'hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Rotate</span>
                </button>

                {/* Zoom */}
                <button
                  onClick={handleZoom}
                  className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5 text-content-muted" />
                  <span>Zoom</span>
                </button>

                {/* Pan */}
                <button
                  onClick={handlePan}
                  className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Pan Camera"
                >
                  <Move className="w-3.5 h-3.5 text-content-muted" />
                  <span>Pan</span>
                </button>

                {/* Fit Graph */}
                <button
                  onClick={handleFitGraph}
                  className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Fit All Nodes"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-content-muted" />
                  <span>Fit Graph</span>
                </button>

                {/* Reset */}
                <button
                  onClick={handleResetCamera}
                  className="px-3 py-1.5 rounded-full hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Reset View"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-content-muted" />
                  <span>Reset</span>
                </button>
              </div>

              {/* Bottom-Right 3D Mini-Map Radar Thumbnail matching screenshot */}
              <div className="pointer-events-auto w-48 h-28 rounded-xl bg-[#030906]/95 backdrop-blur-md border border-[#00e676]/30 overflow-hidden relative shadow-2xl flex items-center justify-center">
                {/* Concentric radar rings */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-40 h-40 rounded-full border border-[#00e676]/10" />
                  <div className="w-28 h-28 rounded-full border border-[#00e676]/15" />
                  <div className="w-16 h-16 rounded-full border border-[#00e676]/20" />
                  <div className="w-6 h-6 rounded-full border border-[#00e676]/30" />
                </div>

                {/* Rotating radar sweep */}
                <div 
                  className="absolute inset-0 origin-center pointer-events-none opacity-20"
                  style={{
                    background: 'conic-gradient(from 0deg, transparent 0deg, rgba(0,230,118,0.4) 60deg, transparent 65deg)',
                    animation: 'spin 4s linear infinite'
                  }}
                />

                {/* Miniature node dots and connecting lines */}
                <svg className="w-full h-full absolute inset-0 pointer-events-none">
                  {edges.map((edge) => {
                    const sourceNode = nodes.find(n => n.id === edge.sourceId);
                    const targetNode = nodes.find(n => n.id === edge.targetId);
                    if (!sourceNode || !targetNode) return null;
                    const x1 = 96 + (sourceNode.x || 0) * 0.35;
                    const y1 = 56 - (sourceNode.y || 0) * 0.32;
                    const x2 = 96 + (targetNode.x || 0) * 0.35;
                    const y2 = 56 - (targetNode.y || 0) * 0.32;
                    return (
                      <line
                        key={edge.id}
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={edge.style === 'solid-green' ? '#00e676' : edge.style === 'solid-red' ? '#ef4444' : '#f59e0b'}
                        strokeWidth={edge.style === 'solid-green' ? 1.2 : 1}
                        strokeDasharray={edge.style.includes('dashed') ? '2,2' : undefined}
                        opacity="0.65"
                      />
                    );
                  })}
                  {nodes.map((node) => {
                    const cx = 96 + (node.x || 0) * 0.35;
                    const cy = 56 - (node.y || 0) * 0.32;
                    const isCenter = node.badge === 'ACTIVE CASE' || node.type === 'case';
                    return (
                      <circle
                        key={node.id}
                        cx={cx}
                        cy={cy}
                        r={isCenter ? 4.8 : 3.2}
                        fill={node.glowColor || (isCenter ? '#00e676' : '#f59e0b')}
                      />
                    );
                  })}
                </svg>
              </div>

            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT NODE DETAILS INSPECTOR PANEL (4 Columns)                            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-4">
          <div className="p-5 rounded-2xl bg-[#06140c] border border-primary/20 flex flex-col gap-4 shadow-xl">
            
            {/* Header: Title & Close Button */}
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
              <span className="text-sm font-bold text-white tracking-wide">
                Node Details
              </span>
              <button 
                onClick={() => setSelectedNodeId(currentGraph.defaultSelectedNodeId)}
                className="text-content-muted hover:text-white transition-colors cursor-pointer"
                title="Reset to default node"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Node Summary Card matching screenshot */}
            <div className="flex items-center gap-3.5">
              <div 
                className="w-13 h-13 rounded-full flex items-center justify-center shrink-0 border-2"
                style={{
                  backgroundColor: selectedNode.iconBg,
                  borderColor: selectedNode.glowColor,
                  boxShadow: `0 0 16px ${selectedNode.glowColor}50`
                }}
              >
                {/* Globe for domain, Lock for IP, Document for cases */}
                <div className="w-6 h-6 flex items-center justify-center" style={{ color: selectedNode.iconColor }}>
                  {selectedNode.type === 'domain' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="2" y1="12" x2="22" y2="12"/>
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                  )}
                  {selectedNode.type === 'ip' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  )}
                  {selectedNode.type === 'case' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                  )}
                  {selectedNode.type === 'related-case' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                      <line x1="16" y1="17" x2="8" y2="17"/>
                      <polyline points="10 9 9 9 8 9"/>
                    </svg>
                  )}
                  {selectedNode.type === 'email' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                  )}
                  {selectedNode.type === 'mobile' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                      <line x1="12" y1="18" x2="12.01" y2="18"/>
                    </svg>
                  )}
                  {selectedNode.type === 'bank' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <line x1="3" y1="21" x2="21" y2="21"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                      <polyline points="5 6 12 3 19 6"/>
                      <line x1="4" y1="10" x2="4" y2="21"/>
                      <line x1="20" y1="10" x2="20" y2="21"/>
                      <line x1="8" y1="14" x2="8" y2="17"/>
                      <line x1="12" y1="14" x2="12" y2="17"/>
                      <line x1="16" y1="14" x2="16" y2="17"/>
                    </svg>
                  )}
                  {selectedNode.type === 'url' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-base text-white truncate" title={selectedNode.label}>
                    {selectedNode.label}
                  </span>
                  <button
                    onClick={() => handleCopy(selectedNode.label)}
                    className="text-content-muted hover:text-white transition-colors cursor-pointer"
                    title="Copy value"
                  >
                    {copiedText === selectedNode.label ? (
                      <Check className="w-3.5 h-3.5 text-primary" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-xs text-content-muted mt-0.5">
                  {selectedNode.sublabel}
                </div>

                <div className="mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    selectedNode.badge === 'Malicious' ? 'bg-[#ef4444] text-white' :
                    selectedNode.badge === 'Verified' ? 'bg-[#00e676] text-[#020b06]' :
                    selectedNode.badge === 'Related' ? 'bg-[#0284c7] text-white' :
                    'bg-[#d97706] text-white'
                  }`}>
                    {selectedNode.badge}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Key-Value List matching screenshot */}
            <div className="flex flex-col gap-2.5 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="text-content-muted">Type</span>
                <span className="text-white font-medium">{selectedNode.sublabel}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Value</span>
                <span className="text-white font-mono">{selectedNode.label}</span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-content-muted shrink-0">Source</span>
                <span className="text-white text-right text-xs leading-tight">
                  {selectedNode.sourceProvenance}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">First Seen</span>
                <span className="text-white font-mono">{selectedNode.firstSeen}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Last Seen</span>
                <span className="text-white font-mono">{selectedNode.lastSeen}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Status</span>
                <span className={`font-bold font-mono ${
                  selectedNode.badge === 'Malicious' ? 'text-[#ef4444]' :
                  selectedNode.badge === 'Verified' ? 'text-[#00e676]' :
                  selectedNode.badge === 'Related' ? 'text-[#38bdf8]' :
                  'text-[#f59e0b]'
                }`}>
                  {selectedNode.statusText}
                </span>
              </div>

              <div className="flex items-start justify-between gap-2">
                <span className="text-content-muted shrink-0">Reputation</span>
                <span className="text-white text-right text-xs">
                  {selectedNode.reputation}
                </span>
              </div>
            </div>

            {/* Explanation Box matching screenshot */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
              <span className="text-xs font-bold text-white">Explanation</span>
              <div className="p-3 rounded-xl bg-[#08180e] border border-white/[0.06] text-xs text-content-secondary leading-relaxed">
                {selectedNode.explanation}
              </div>
            </div>

            {/* Related Items (4) matching screenshot */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Related Items ({selectedNode.relatedItems.length})
                </span>
                <button 
                  onClick={() => showToast('Displaying all correlated entities.')}
                  className="text-xs font-medium text-[#00e676] hover:underline cursor-pointer"
                >
                  View All &gt;
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {selectedNode.relatedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (item.iconType === 'related-case') {
                        const targetCase = availableComplaints.find(c =>
                          c.referenceNumber === item.label ||
                          `node-${c.id}` === item.id ||
                          c.id === item.id.replace('node-', '')
                        );
                        if (targetCase) {
                          setActiveCaseId(targetCase.id);
                          onSelectCase?.(targetCase.id);
                          showToast(`Switched active graph anchor to ${targetCase.referenceNumber}`);
                          return;
                        }
                      }
                      setSelectedNodeId(item.id);
                      const targetNode = nodes.find(n => n.id === item.id);
                      if (targetNode) handleNodeClick(targetNode);
                    }}
                    className="p-2.5 rounded-xl bg-[#081a10] border border-white/[0.06] hover:border-primary/40 flex items-center justify-between transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                        item.iconType === 'ip' ? 'bg-[#371014] text-[#ef4444] border-[#ef4444]/30' :
                        item.iconType === 'related-case' ? 'bg-[#082f49] text-[#38bdf8] border-[#38bdf8]/30' :
                        item.iconType === 'email' ? 'bg-[#31104a] text-[#a855f7] border-[#a855f7]/30' :
                        item.iconType === 'url' ? 'bg-[#3d2508] text-[#f59e0b] border-[#f59e0b]/30' :
                        'bg-[#052e16] text-[#00e676] border-[#00e676]/30'
                      }`}>
                        {item.iconType === 'ip' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                          </svg>
                        )}
                        {item.iconType === 'related-case' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                          </svg>
                        )}
                        {item.iconType === 'url' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                          </svg>
                        )}
                        {item.iconType === 'email' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                        )}
                        {item.iconType === 'domain' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="2" y1="12" x2="22" y2="12"/>
                          </svg>
                        )}
                        {item.iconType === 'mobile' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                          </svg>
                        )}
                        {item.iconType === 'bank' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <line x1="3" y1="21" x2="21" y2="21"/>
                            <line x1="3" y1="10" x2="21" y2="10"/>
                            <polyline points="5 6 12 3 19 6"/>
                          </svg>
                        )}
                      </div>

                      <div className="min-w-0">
                        <span className="text-xs font-mono font-bold text-white group-hover:text-primary transition-colors block truncate">
                          {item.label}
                        </span>
                        <span className="text-[11px] text-content-muted block truncate">
                          {item.typeDesc}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      item.badge === 'Malicious' ? 'bg-[#ef4444] text-white' :
                      item.badge === 'Related' ? 'bg-[#0284c7] text-white' :
                      'bg-[#b45309] text-white'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Primary Action Button matching screenshot */}
            <div className="pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  onSelectCase?.(activeCaseId);
                  onSelectTab('investigation-workspace');
                  showToast('Navigating to Investigation Workspace for active case.');
                }}
                className="w-full py-3 rounded-xl bg-[#062414] hover:bg-[#0c3920] border border-[#00e676] text-[#00e676] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,230,118,0.2)] transition-all cursor-pointer"
              >
                <span>Open in Investigation Workspace</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
