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
  Plus,
  Compass,
  Layers,
  Eye,
  FileText,
  User,
  ShieldAlert
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
  type: 'case' | 'domain' | 'ip' | 'related-case' | 'url' | 'bank' | 'card' | 'email' | 'mobile' | 'person' | 'document' | 'device';
  badge: string;
  badgeType: 'active' | 'danger' | 'warning' | 'info' | 'success' | 'muted';
  glowColor: string;
  iconBg: string;
  iconColor: string;
  iconType: 'case' | 'domain' | 'ip' | 'related-case' | 'url' | 'bank' | 'card' | 'email' | 'mobile' | 'person' | 'document' | 'device';
  isConstellation?: boolean;
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
    iconType: 'domain' | 'related-case' | 'url' | 'ip' | 'mobile' | 'bank' | 'card' | 'email' | 'person' | 'document' | 'device';
  }>;
}

export interface CorrelationGraphEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
  style: 'solid-green' | 'dashed-amber' | 'solid-red' | 'solid-amber' | 'dashed-grey' | 'solid-cyan' | 'solid-pink';
  badgeColor?: string;
  verified: boolean;
}

// Regex extractors for dynamic IOC extraction across real complaints
const EXTRACTORS = {
  domain: /(?:https?:\/\/)?([a-zA-Z0-9][-a-zA-Z0-9]*\.[a-zA-Z]{2,}(?:\.[a-zA-Z]{2,})?)/gi,
  ip: /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
  phone: /(?:\+91[\-\s]?)?[6-9]\d{9}/g,
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  upi: /[a-zA-Z0-9._-]+@(ok[a-zA-Z]+|paytm|ybl|axl|upi|sbi|icici|hdfcbank)/gi,
  bankAcct: /\b(?:\d{4}[\s-]?){3}\d{4}\b|\b(?:acct|account|a\/c)?[\s:]*([0-9Xx]{8,18})\b/gi
};

/**
 * Universal Dynamic Multi-Case Correlation Builder
 * Fully connects with ALL cases reported in the platform.
 * Formats canonical 10-node topology for CYBER-2026-7102 matching reference images,
 * and dynamically extracts real IOCs and cross-links for ANY complaint submitted.
 */
export function buildCorrelationGraphForCase(
  caseId: string,
  allComplaints: Complaint[]
): { nodes: CorrelationGraphNode[]; edges: CorrelationGraphEdge[]; defaultSelectedNodeId: string } {
  const activeComplaint = allComplaints.find(
    c => c.id === caseId || c.referenceNumber.toLowerCase() === caseId.toLowerCase()
  ) || allComplaints.find(c => c.id === 'case-7102') || allComplaints[0];

  const normId = activeComplaint?.id || caseId;
  const refNum = activeComplaint?.referenceNumber || 'CYBER-2026-7102';

  // Helper to generate 24 ambient background constellation nodes for depth
  const generateConstellationNodes = (): { cNodes: CorrelationGraphNode[]; cEdges: CorrelationGraphEdge[] } => {
    const cNodes: CorrelationGraphNode[] = [];
    const cEdges: CorrelationGraphEdge[] = [];
    const constAngles = [
      0.15, 0.45, 0.85, 1.25, 1.65, 2.05, 2.45, 2.85, 3.25, 3.65, 4.05, 4.45, 4.85, 5.25, 5.65, 6.05,
      0.65, 1.45, 2.25, 3.05, 3.85, 4.65, 5.45, 5.95
    ];
    constAngles.forEach((ang, i) => {
      const dist = 245 + (i % 6) * 26;
      const yElev = ((i % 4) - 1.5) * 48;
      const cNode: CorrelationGraphNode = {
        id: `constellation-${i}`,
        label: `SOC-NODE-${100 + i}`,
        sublabel: 'Constellation Mesh',
        type: 'device',
        iconType: 'device',
        badge: 'MONITORING',
        badgeType: 'muted',
        glowColor: '#163824',
        iconBg: '#05180f',
        iconColor: '#245236',
        isConstellation: true,
        x: Math.cos(ang) * dist,
        y: yElev,
        z: Math.sin(ang) * dist,
        sourceProvenance: 'Ambient Threat Intelligence Mesh',
        firstSeen: 'Baseline Telemetry',
        lastSeen: 'Realtime Mesh',
        statusText: '• AMBIENT SENSOR',
        reputation: 'Passive sensor node in outer national cyber defense grid',
        relatedCasesCount: 0,
        explanation: 'Ambient secondary sensor cluster in the outer defensive constellation.',
        relatedItems: []
      };
      cNodes.push(cNode);
      if (i > 0 && i % 2 === 0) {
        cEdges.push({
          id: `ce-${i}`,
          sourceId: `constellation-${i}`,
          targetId: `constellation-${i - 1}`,
          label: '',
          style: 'dashed-grey',
          badgeColor: '#1a402d',
          verified: false
        });
      }
    });
    return { cNodes, cEdges };
  };

  const { cNodes: backgroundConstellationNodes, cEdges: backgroundConstellationEdges } = generateConstellationNodes();

  // 1. CANONICAL MODEL: CASE-7102 (Matches 360° Reference Images 1-12 & Visual Decoding Spec)
  if (normId === 'case-7102' || refNum === 'CYBER-2026-7102') {
    const centerNode: CorrelationGraphNode = {
      id: 'node-case-7102',
      label: 'CYBER-2026-7102',
      sublabel: 'UPI / QR Code Scam',
      type: 'case',
      iconType: 'case',
      badge: 'ACTIVE CASE',
      badgeType: 'active',
      glowColor: '#00e5ff',
      iconBg: '#052e16',
      iconColor: '#00e5ff',
      x: 0,
      y: 0,
      z: 0,
      fx: 0,
      fy: 0,
      fz: 0,
      sourceProvenance: 'Citizen complaint narrative & UPI transaction statement',
      firstSeen: '12 Jun 2026, 10:24 AM',
      lastSeen: '14 Jun 2026, 11:20 PM',
      statusText: '• ACTIVE CASE',
      reputation: 'Verified victim complaint (Citizen Portal)',
      relatedCasesCount: 4,
      explanation: 'Primary Anchor Hub: Online UPI debit fraud where victim was deceived via counterfeit QR code lure and phishing banking portal.',
      relatedItems: [
        { id: 'node-domain-fake', label: 'fake-bank-verify.in', typeDesc: 'Domain • similar domain', badge: 'MALICIOUS', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-mobile-suspect', label: '+91 98765 43210', typeDesc: 'Mobile • reported in', badge: 'Seen in 3 cases', badgeType: 'success', iconType: 'mobile' },
        { id: 'node-upi-id', label: 'UPI ID: fraudpay@upi', typeDesc: 'UPI ID • transaction to', badge: 'FLAGGED', badgeType: 'danger', iconType: 'bank' },
        { id: 'node-bank-acct', label: 'Bank Account XXXXXXXX4321', typeDesc: 'Bank Account • similar account', badge: 'UNVERIFIED', badgeType: 'warning', iconType: 'card' },
        { id: 'node-suspect-actor', label: 'Suspected Actor', typeDesc: 'Person • linked to', badge: 'Multiple Cases (4)', badgeType: 'danger', iconType: 'person' },
        { id: 'node-evidence-pdf', label: 'evidence_0032.pdf', typeDesc: 'Document • contains', badge: 'PDF Document', badgeType: 'info', iconType: 'document' },
        { id: 'node-email-fake', label: 'support@fakebank.in', typeDesc: 'Email • mentioned in', badge: 'PHISHING EMAIL', badgeType: 'warning', iconType: 'email' }
      ]
    };

    // Satellite 1: Top-Left — fake-bank-verify.in (Globe • Crimson Red)
    const domainNode1: CorrelationGraphNode = {
      id: 'node-domain-fake',
      label: 'fake-bank-verify.in',
      sublabel: 'Domain',
      type: 'domain',
      iconType: 'domain',
      badge: 'MALICIOUS',
      badgeType: 'danger',
      glowColor: '#ff1744',
      iconBg: '#371014',
      iconColor: '#ff1744',
      x: -38,
      y: 74,
      z: 22,
      sourceProvenance: 'Extracted from victim SMS lure and complaint logs',
      firstSeen: '12 Jun 2026, 09:45 AM',
      lastSeen: '14 Jun 2026, 11:20 PM',
      statusText: '• MALICIOUS HOST',
      reputation: 'Known credential harvesting phishing domain (Threat Intelligence)',
      relatedCasesCount: 3,
      explanation: 'Malicious domain mimicking netbanking verification interface. Captured victim credentials and routed SMS OTP tokens.',
      relatedItems: [
        { id: 'node-domain-sbi', label: 'sbi-alert-secure.in', typeDesc: 'Domain • similar pattern', badge: 'MALICIOUS', badgeType: 'danger', iconType: 'domain' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • contains URL', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    // Satellite 2: Top-Center — sbi-alert-secure.in (Globe • Crimson Red)
    const domainNode2: CorrelationGraphNode = {
      id: 'node-domain-sbi',
      label: 'sbi-alert-secure.in',
      sublabel: 'Domain',
      type: 'domain',
      iconType: 'domain',
      badge: 'MALICIOUS',
      badgeType: 'danger',
      glowColor: '#ff1744',
      iconBg: '#371014',
      iconColor: '#ff1744',
      x: 32,
      y: 70,
      z: -18,
      sourceProvenance: 'Threat Telemetry & Passive DNS Discovery',
      firstSeen: '10 Jun 2026, 04:12 PM',
      lastSeen: '14 Jun 2026, 08:30 PM',
      statusText: '• MALICIOUS HOST',
      reputation: 'Syndicated lookalike domain registered via offshore bulletproof registrar',
      relatedCasesCount: 2,
      explanation: 'Secondary domain utilizing identical SSL certificate and website fingerprint as fake-bank-verify.in.',
      relatedItems: [
        { id: 'node-ip-c2', label: '192.168.10.45', typeDesc: 'IP Address • resolves to', badge: 'SUSPICIOUS', badgeType: 'warning', iconType: 'ip' },
        { id: 'node-domain-fake', label: 'fake-bank-verify.in', typeDesc: 'Domain • similar pattern', badge: 'MALICIOUS', badgeType: 'danger', iconType: 'domain' }
      ]
    };

    // Satellite 3: Top-Right — 192.168.10.45 (Map Pin • Neon Purple)
    const ipNode: CorrelationGraphNode = {
      id: 'node-ip-c2',
      label: '192.168.10.45',
      sublabel: 'IP Address',
      type: 'ip',
      iconType: 'ip',
      badge: 'SUSPICIOUS',
      badgeType: 'warning',
      glowColor: '#a855f7',
      iconBg: '#2e1042',
      iconColor: '#a855f7',
      x: 94,
      y: 54,
      z: -24,
      sourceProvenance: 'Netflow Telemetry & DNS Resolution',
      firstSeen: '09 Jun 2026, 11:15 AM',
      lastSeen: '14 Jun 2026, 06:45 PM',
      statusText: '• SUSPICIOUS PROXY',
      reputation: 'Bulletproof hosting VPS hosting multiple deceptive financial phishing portals',
      relatedCasesCount: 3,
      explanation: 'Reverse proxy server resolving both fake-bank-verify.in and sbi-alert-secure.in.',
      relatedItems: [
        { id: 'node-domain-sbi', label: 'sbi-alert-secure.in', typeDesc: 'Domain • resolves to', badge: 'MALICIOUS', badgeType: 'danger', iconType: 'domain' }
      ]
    };

    // Satellite 4: Mid-Right — support@fakebank.in (Mail • Warm Amber)
    const emailNode: CorrelationGraphNode = {
      id: 'node-email-fake',
      label: 'support@fakebank.in',
      sublabel: 'Email Address',
      type: 'email',
      iconType: 'email',
      badge: 'PHISHING EMAIL',
      badgeType: 'warning',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: 108,
      y: 12,
      z: 18,
      sourceProvenance: 'Victim inbox headers & SPF validation failure',
      firstSeen: '12 Jun 2026, 09:30 AM',
      lastSeen: '13 Jun 2026, 02:15 PM',
      statusText: '• PHISHING ALIAS',
      reputation: 'Spoofed sender address utilized in banking KYC deceptions',
      relatedCasesCount: 2,
      explanation: 'Originating email alias delivering bogus account debit notifications and directing victims to phone verification.',
      relatedItems: [
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • mentioned in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-suspect-actor', label: 'Suspected Actor', typeDesc: 'Person • mentioned in', badge: 'Multiple Cases (4)', badgeType: 'danger', iconType: 'person' }
      ]
    };

    // Satellite 5: Far-Right — Suspected Actor (Avatar • Hot Pink)
    const suspectNode: CorrelationGraphNode = {
      id: 'node-suspect-actor',
      label: 'Suspected Actor',
      sublabel: 'Person / Entity',
      type: 'person',
      iconType: 'person',
      badge: 'Multiple Cases (4)',
      badgeType: 'danger',
      glowColor: '#ec4899',
      iconBg: '#3b0d26',
      iconColor: '#ec4899',
      x: 100,
      y: -28,
      z: -14,
      sourceProvenance: 'Inter-state police cyber intelligence dossier',
      firstSeen: '01 Jun 2026, 02:00 PM',
      lastSeen: '14 Jun 2026, 11:30 PM',
      statusText: '• FLAGGED OPERATOR',
      reputation: 'Organized syndicate kingpin coordinating call-center fraud hubs',
      relatedCasesCount: 4,
      explanation: 'Primary suspect persona linked across 4 distinct financial cybercrime dockets in Karnataka, Delhi, and Maharashtra.',
      relatedItems: [
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • linked to', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' },
        { id: 'node-upi-id', label: 'UPI ID: fraudpay@upi', typeDesc: 'UPI ID • linked to', badge: 'FLAGGED', badgeType: 'danger', iconType: 'bank' }
      ]
    };

    // Satellite 6: Bottom-Right — UPI ID: fraudpay@upi (Bank Columns • Teal)
    const upiNode: CorrelationGraphNode = {
      id: 'node-upi-id',
      label: 'UPI ID: fraudpay@upi',
      sublabel: 'UPI ID',
      type: 'bank',
      iconType: 'bank',
      badge: 'FLAGGED',
      badgeType: 'danger',
      glowColor: '#06b6d4',
      iconBg: '#083344',
      iconColor: '#06b6d4',
      x: 82,
      y: -70,
      z: 16,
      sourceProvenance: 'NPCI UPI switch audit log',
      firstSeen: '12 Jun 2026, 10:24 AM',
      lastSeen: '14 Jun 2026, 05:10 PM',
      statusText: '• FLAGGED BENEFICIARY',
      reputation: 'Flagged beneficiary VPA under Section 102 CrPC freeze',
      relatedCasesCount: 3,
      explanation: 'Destination VPA that received ₹50,000 debit from victim wallet before rapid multi-hop disbursement.',
      relatedItems: [
        { id: 'node-bank-acct', label: 'Bank Account XXXXXXXX4321', typeDesc: 'Bank Account • linked account', badge: 'UNVERIFIED', badgeType: 'warning', iconType: 'card' },
        { id: 'node-suspect-actor', label: 'Suspected Actor', typeDesc: 'Person • linked to', badge: 'Multiple Cases (4)', badgeType: 'danger', iconType: 'person' }
      ]
    };

    // Satellite 7: Bottom-Center — Bank Account XXXXXXXX4321 (Credit Card • Gold / Orange)
    const bankNode: CorrelationGraphNode = {
      id: 'node-bank-acct',
      label: 'Bank Account XXXXXXXX4321',
      sublabel: 'Bank Account / UPI',
      type: 'card',
      iconType: 'card',
      badge: 'UNVERIFIED',
      badgeType: 'warning',
      glowColor: '#f59e0b',
      iconBg: '#38250b',
      iconColor: '#f59e0b',
      x: 8,
      y: -86,
      z: -22,
      sourceProvenance: 'Nodal Bank IMPS Settlement Feed',
      firstSeen: '12 Jun 2026, 10:25 AM',
      lastSeen: '13 Jun 2026, 09:40 AM',
      statusText: '• UNVERIFIED MULE',
      reputation: 'Tier-1 mule beneficiary account operated in Indiranagar, Bangalore',
      relatedCasesCount: 2,
      explanation: 'Settlement bank account tied to beneficiary VPA where scam proceeds were converted into cash withdrawals.',
      relatedItems: [
        { id: 'node-upi-id', label: 'UPI ID: fraudpay@upi', typeDesc: 'UPI ID • transaction to', badge: 'FLAGGED', badgeType: 'danger', iconType: 'bank' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • similar account', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    // Satellite 8: Bottom-Left — evidence_0032.pdf (Doc Sheet • Royal Blue)
    const fileNode: CorrelationGraphNode = {
      id: 'node-evidence-pdf',
      label: 'evidence_0032.pdf',
      sublabel: 'Document / File',
      type: 'document',
      iconType: 'document',
      badge: 'PDF Document',
      badgeType: 'info',
      glowColor: '#3b82f6',
      iconBg: '#1e3a8a',
      iconColor: '#3b82f6',
      x: -76,
      y: -70,
      z: 24,
      sourceProvenance: 'Citizen Evidence Upload (SHA256 Verified)',
      firstSeen: '12 Jun 2026, 10:45 AM',
      lastSeen: '12 Jun 2026, 10:45 AM',
      statusText: '• VERIFIED EVIDENCE',
      reputation: 'Authentic PDF bank transaction receipt submitted by complainant',
      relatedCasesCount: 1,
      explanation: 'Complainant submitted bank passbook statement showing unauthorized ₹50,000 debit and timestamp reference.',
      relatedItems: [
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • contains', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    // Satellite 9: Mid-Left — +91 98765 43210 (Phone • Emerald Green)
    const mobileNode: CorrelationGraphNode = {
      id: 'node-mobile-suspect',
      label: '+91 98765 43210',
      sublabel: 'Mobile Number',
      type: 'mobile',
      iconType: 'mobile',
      badge: 'Seen in 3 cases',
      badgeType: 'success',
      glowColor: '#10b981',
      iconBg: '#052e16',
      iconColor: '#10b981',
      x: -106,
      y: -8,
      z: -18,
      sourceProvenance: 'Telecom CDR Telemetry (Airtel Karnataka)',
      firstSeen: '12 Jun 2026, 10:15 AM',
      lastSeen: '14 Jun 2026, 04:30 PM',
      statusText: '• VERIFIED CALLER',
      reputation: 'Active calling number posing as bank security officer',
      relatedCasesCount: 3,
      explanation: 'Suspect number identified across 3 separate complaints initiating voice calls claiming urgent bank verification.',
      relatedItems: [
        { id: 'node-device-fp', label: 'device_fingerprint', typeDesc: 'Device • used on', badge: '3 related cases', badgeType: 'info', iconType: 'device' },
        { id: 'node-case-7102', label: 'CYBER-2026-7102', typeDesc: 'Active Case • reported in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };

    // Satellite 10: Top-Left Outer — device_fingerprint (Laptop • Electric Blue)
    const deviceNode: CorrelationGraphNode = {
      id: 'node-device-fp',
      label: 'device_fingerprint',
      sublabel: 'Device',
      type: 'device',
      iconType: 'device',
      badge: '3 related cases',
      badgeType: 'info',
      glowColor: '#0ea5e9',
      iconBg: '#0e3a47',
      iconColor: '#0ea5e9',
      x: -96,
      y: 48,
      z: 18,
      sourceProvenance: 'Web session header entropy & Canvas fingerprinting',
      firstSeen: '11 Jun 2026, 08:20 PM',
      lastSeen: '14 Jun 2026, 09:15 PM',
      statusText: '• HARVESTED FINGERPRINT',
      reputation: 'Android hardware signature shared between scam caller & phishing backend',
      relatedCasesCount: 3,
      explanation: 'Unique device profile captured during administration of phishing host and SIM card switching.',
      relatedItems: [
        { id: 'node-mobile-suspect', label: '+91 98765 43210', typeDesc: 'Mobile • used on', badge: 'Seen in 3 cases', badgeType: 'success', iconType: 'mobile' }
      ]
    };

    // Edges matching ASCII architecture diagram precisely
    const edges: CorrelationGraphEdge[] = [
      { id: 'e-7102-1', sourceId: 'node-case-7102', targetId: 'node-domain-fake', label: 'similar domain', style: 'solid-red', badgeColor: '#ff1744', verified: false },
      { id: 'e-7102-2', sourceId: 'node-domain-fake', targetId: 'node-domain-sbi', label: 'similar pattern', style: 'dashed-amber', badgeColor: '#ff1744', verified: false },
      { id: 'e-7102-3', sourceId: 'node-domain-sbi', targetId: 'node-ip-c2', label: 'resolved to', style: 'solid-amber', badgeColor: '#a855f7', verified: true },
      { id: 'e-7102-4', sourceId: 'node-case-7102', targetId: 'node-email-fake', label: 'mentioned in', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7102-5', sourceId: 'node-email-fake', targetId: 'node-suspect-actor', label: 'mentioned in', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
      { id: 'e-7102-6', sourceId: 'node-case-7102', targetId: 'node-suspect-actor', label: 'linked to', style: 'solid-pink', badgeColor: '#ec4899', verified: true },
      { id: 'e-7102-7', sourceId: 'node-case-7102', targetId: 'node-upi-id', label: 'transaction to', style: 'solid-cyan', badgeColor: '#06b6d4', verified: true },
      { id: 'e-7102-8', sourceId: 'node-upi-id', targetId: 'node-suspect-actor', label: 'linked to', style: 'solid-pink', badgeColor: '#ec4899', verified: true },
      { id: 'e-7102-9', sourceId: 'node-case-7102', targetId: 'node-bank-acct', label: 'similar account', style: 'solid-amber', badgeColor: '#f59e0b', verified: true },
      { id: 'e-7102-10', sourceId: 'node-bank-acct', targetId: 'node-upi-id', label: 'similar account', style: 'solid-cyan', badgeColor: '#06b6d4', verified: true },
      { id: 'e-7102-11', sourceId: 'node-case-7102', targetId: 'node-evidence-pdf', label: 'contains', style: 'solid-green', badgeColor: '#3b82f6', verified: true },
      { id: 'e-7102-12', sourceId: 'node-case-7102', targetId: 'node-mobile-suspect', label: 'reported in', style: 'solid-green', badgeColor: '#10b981', verified: true },
      { id: 'e-7102-13', sourceId: 'node-mobile-suspect', targetId: 'node-device-fp', label: 'used on', style: 'solid-green', badgeColor: '#0ea5e9', verified: true }
    ];

    return {
      nodes: [centerNode, domainNode1, domainNode2, ipNode, emailNode, suspectNode, upiNode, bankNode, fileNode, mobileNode, deviceNode, ...backgroundConstellationNodes],
      edges: [...edges, ...backgroundConstellationEdges],
      defaultSelectedNodeId: 'node-domain-fake'
    };
  }

  // 2. UNIVERSAL DYNAMIC GRAPH ENGINE FOR ANY OTHER REPORTED COMPLAINT
  // Extracts live IOCs and dynamically cross-correlates against all other complaints in database
  const desc = activeComplaint?.description || '';
  const suspect = activeComplaint?.suspectInfo || {};

  // Extract IOCs
  const extractedDomains = Array.from(desc.matchAll(EXTRACTORS.domain)).map(m => m[1].toLowerCase());
  if (suspect.website) extractedDomains.push(suspect.website.replace(/^https?:\/\//, '').split('/')[0].toLowerCase());
  const primaryDomain = extractedDomains[0] || `secure-${activeComplaint.category.toLowerCase().replace(/[^a-z0-9]/g, '-')}-gateway.org`;

  const extractedIps = Array.from(desc.matchAll(EXTRACTORS.ip)).map(m => m[0]);
  if (suspect.ipAddress) extractedIps.push(suspect.ipAddress);
  const primaryIp = extractedIps[0] || '198.51.100.42';

  const extractedPhones = Array.from(desc.matchAll(EXTRACTORS.phone)).map(m => m[0]);
  if (suspect.phone) extractedPhones.push(suspect.phone);
  const primaryPhone = extractedPhones[0] || '+91 98112 34567';

  const extractedEmails = Array.from(desc.matchAll(EXTRACTORS.email)).map(m => m[0]);
  if (suspect.email) extractedEmails.push(suspect.email);
  const primaryEmail = extractedEmails[0] || `threat-alert@${primaryDomain}`;

  const extractedUpis = Array.from(desc.matchAll(EXTRACTORS.upi)).map(m => m[0]);
  const primaryUpi = extractedUpis[0] || `recovery-desk@okhdfcbank`;

  const suspectAlias = suspect.alias || 'Syndicate Operator';
  const evidenceName = activeComplaint?.evidenceFiles?.[0]?.name || 'docket_evidence_extract.pdf';

  // Cross-reference against all other complaints to find actual correlated dockets
  const relatedCases = allComplaints.filter(c => {
    if (c.id === activeComplaint.id) return false;
    const otherText = (c.description + ' ' + (c.suspectInfo?.phone || '') + ' ' + (c.suspectInfo?.website || '')).toLowerCase();
    const sharesCategory = c.category === activeComplaint.category;
    const sharesPhone = Boolean(primaryPhone && otherText.includes(primaryPhone.slice(-8)));
    const sharesDomain = Boolean(primaryDomain && otherText.includes(primaryDomain));
    return sharesPhone || sharesDomain || sharesCategory;
  }).slice(0, 3);

  const centerNode: CorrelationGraphNode = {
    id: `node-${activeComplaint.id}`,
    label: activeComplaint.referenceNumber,
    sublabel: activeComplaint.category || activeComplaint.title,
    type: 'case',
    iconType: 'case',
    badge: 'ACTIVE CASE',
    badgeType: 'active',
    glowColor: '#00e5ff',
    iconBg: '#052e16',
    iconColor: '#00e5ff',
    x: 0,
    y: 0,
    z: 0,
    fx: 0,
    fy: 0,
    fz: 0,
    sourceProvenance: `Citizen portal submission by ${activeComplaint.citizenName || 'Verified Complainant'}`,
    firstSeen: activeComplaint.incidentDate || activeComplaint.reportedDate || 'Active Docket',
    lastSeen: activeComplaint.reportedDate || 'Recently Updated',
    statusText: `• ${activeComplaint.status.toUpperCase()}`,
    reputation: `${activeComplaint.severity} Severity Incident (${activeComplaint.category})`,
    relatedCasesCount: relatedCases.length + 1,
    explanation: `Active Anchor Hub: ${activeComplaint.title}. Reported loss of ₹${(activeComplaint.financialLoss || 0).toLocaleString()}. Sovereign AI correlated ${relatedCases.length} peer dockets on platform.`,
    relatedItems: [
      { id: 'node-domain-dyn', label: primaryDomain, typeDesc: 'Domain • primary IOC', badge: 'MALICIOUS', badgeType: 'danger', iconType: 'domain' },
      { id: 'node-phone-dyn', label: primaryPhone, typeDesc: 'Mobile • verified suspect', badge: `Seen in ${Math.max(2, relatedCases.length + 1)} cases`, badgeType: 'success', iconType: 'mobile' },
      { id: 'node-upi-dyn', label: `UPI: ${primaryUpi}`, typeDesc: 'UPI • beneficiary VPA', badge: 'FLAGGED', badgeType: 'danger', iconType: 'bank' }
    ]
  };

  const domainNode: CorrelationGraphNode = {
    id: 'node-domain-dyn',
    label: primaryDomain,
    sublabel: 'Domain',
    type: 'domain',
    iconType: 'domain',
    badge: 'MALICIOUS',
    badgeType: 'danger',
    glowColor: '#ff1744',
    iconBg: '#371014',
    iconColor: '#ff1744',
    x: -36,
    y: 74,
    z: 20,
    sourceProvenance: 'Extracted from complaint docket telemetry',
    firstSeen: activeComplaint.reportedDate || 'Active',
    lastSeen: 'Recently Monitored',
    statusText: '• MALICIOUS HOST',
    reputation: 'Flagged malicious domain hosting unauthorized portal',
    relatedCasesCount: 2,
    explanation: `Malicious domain identified in docket ${activeComplaint.referenceNumber}. Correlated with syndicated cyber offensive campaigns.`,
    relatedItems: [
      { id: `node-${activeComplaint.id}`, label: activeComplaint.referenceNumber, typeDesc: 'Active Case • source link', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const ipNode: CorrelationGraphNode = {
    id: 'node-ip-dyn',
    label: primaryIp,
    sublabel: 'IP Address',
    type: 'ip',
    iconType: 'ip',
    badge: 'SUSPICIOUS',
    badgeType: 'warning',
    glowColor: '#a855f7',
    iconBg: '#2e1042',
    iconColor: '#a855f7',
    x: 94,
    y: 52,
    z: -20,
    sourceProvenance: 'Perimeter firewall NetFlow telemetry',
    firstSeen: 'Telemetry Correlated',
    lastSeen: 'Live Telemetry',
    statusText: '• SUSPICIOUS ROUTE',
    reputation: 'C2 and proxy node routed through bulletproof hosting provider',
    relatedCasesCount: 2,
    explanation: `Proxy IP address routing communications for ${primaryDomain} and related syndicates.`,
    relatedItems: [
      { id: 'node-domain-dyn', label: primaryDomain, typeDesc: 'Domain • resolves to', badge: 'MALICIOUS', badgeType: 'danger', iconType: 'domain' }
    ]
  };

  const phoneNode: CorrelationGraphNode = {
    id: 'node-phone-dyn',
    label: primaryPhone,
    sublabel: 'Mobile Number',
    type: 'mobile',
    iconType: 'mobile',
    badge: `Seen in ${Math.max(2, relatedCases.length + 1)} cases`,
    badgeType: 'success',
    glowColor: '#10b981',
    iconBg: '#052e16',
    iconColor: '#10b981',
    x: -104,
    y: -8,
    z: -16,
    sourceProvenance: 'Cellular carrier CDR & victim transaction logs',
    firstSeen: activeComplaint.incidentDate || 'Active',
    lastSeen: 'Verified Telecom Ingest',
    statusText: '• VERIFIED CALLER',
    reputation: 'Verified suspect calling number initiating social engineering lures',
    relatedCasesCount: Math.max(2, relatedCases.length + 1),
    explanation: `Suspect mobile line actively communicating with complainant during incident execution.`,
    relatedItems: [
      { id: `node-${activeComplaint.id}`, label: activeComplaint.referenceNumber, typeDesc: 'Active Case • reported in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const emailNode: CorrelationGraphNode = {
    id: 'node-email-dyn',
    label: primaryEmail,
    sublabel: 'Email Address',
    type: 'email',
    iconType: 'email',
    badge: 'PHISHING EMAIL',
    badgeType: 'warning',
    glowColor: '#f59e0b',
    iconBg: '#38250b',
    iconColor: '#f59e0b',
    x: 106,
    y: 12,
    z: 16,
    sourceProvenance: 'SMTP gateway and victim message headers',
    firstSeen: 'Inbox Extraction',
    lastSeen: 'Active',
    statusText: '• PHISHING ALIAS',
    reputation: 'Deceptive communication handle utilized to transmit forged documents',
    relatedCasesCount: 1,
    explanation: `Originating email address delivering social engineering lure messages.`,
    relatedItems: [
      { id: `node-${activeComplaint.id}`, label: activeComplaint.referenceNumber, typeDesc: 'Active Case • mentioned in', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const upiNode: CorrelationGraphNode = {
    id: 'node-upi-dyn',
    label: `UPI: ${primaryUpi}`,
    sublabel: 'UPI ID',
    type: 'bank',
    iconType: 'bank',
    badge: 'FLAGGED',
    badgeType: 'danger',
    glowColor: '#06b6d4',
    iconBg: '#083344',
    iconColor: '#06b6d4',
    x: 82,
    y: -68,
    z: 14,
    sourceProvenance: 'NPCI UPI switch and banking gateway record',
    firstSeen: activeComplaint.incidentDate || 'Recent',
    lastSeen: 'Active Block',
    statusText: '• FLAGGED BENEFICIARY',
    reputation: 'Target wallet / VPA under Section 102 CrPC debit block',
    relatedCasesCount: 2,
    explanation: `Financial routing endpoint that absorbed fraudulent funds transferred by victim.`,
    relatedItems: [
      { id: `node-${activeComplaint.id}`, label: activeComplaint.referenceNumber, typeDesc: 'Active Case • transaction to', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const suspectNode: CorrelationGraphNode = {
    id: 'node-suspect-dyn',
    label: suspectAlias,
    sublabel: 'Person / Entity',
    type: 'person',
    iconType: 'person',
    badge: `Multiple Cases (${Math.max(2, relatedCases.length + 1)})`,
    badgeType: 'danger',
    glowColor: '#ec4899',
    iconBg: '#3b0d26',
    iconColor: '#ec4899',
    x: 98,
    y: -26,
    z: -12,
    sourceProvenance: 'State Cyber Cell Dossier Matching',
    firstSeen: 'Investigative Record',
    lastSeen: 'Active Pursuit',
    statusText: '• SUSPECT IDENTIFIED',
    reputation: 'Key suspect operator linked to syndicated digital fraud rings',
    relatedCasesCount: Math.max(2, relatedCases.length + 1),
    explanation: `Primary actor persona linked to the operation of phone ${primaryPhone} and beneficiary VPA.`,
    relatedItems: [
      { id: `node-${activeComplaint.id}`, label: activeComplaint.referenceNumber, typeDesc: 'Active Case • linked to', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const docNode: CorrelationGraphNode = {
    id: 'node-doc-dyn',
    label: evidenceName,
    sublabel: 'Document Sheet',
    type: 'document',
    iconType: 'document',
    badge: 'PDF Document',
    badgeType: 'info',
    glowColor: '#3b82f6',
    iconBg: '#1e3a8a',
    iconColor: '#3b82f6',
    x: -74,
    y: -68,
    z: 22,
    sourceProvenance: 'Citizen Evidence Upload (Chain of Custody Timestamped)',
    firstSeen: activeComplaint.reportedDate || 'Logged',
    lastSeen: 'Immutable Archive',
    statusText: '• VERIFIED EVIDENCE',
    reputation: 'Authenticated documentary evidence in case docket',
    relatedCasesCount: 1,
    explanation: `Primary evidentiary file associated with this complaint verifying unauthorized transactions.`,
    relatedItems: [
      { id: `node-${activeComplaint.id}`, label: activeComplaint.referenceNumber, typeDesc: 'Active Case • contains', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
    ]
  };

  const deviceNode: CorrelationGraphNode = {
    id: 'node-device-dyn',
    label: 'device_fingerprint',
    sublabel: 'Laptop / Workstation',
    type: 'device',
    iconType: 'device',
    badge: '3 related cases',
    badgeType: 'info',
    glowColor: '#0ea5e9',
    iconBg: '#0e3a47',
    iconColor: '#0ea5e9',
    x: -94,
    y: 46,
    z: 16,
    sourceProvenance: 'Web session header entropy & Canvas fingerprinting',
    firstSeen: 'Session Log',
    lastSeen: 'Realtime telemetry',
    statusText: '• HARVESTED FINGERPRINT',
    reputation: 'Client hardware profile captured across multi-jurisdiction complaints',
    relatedCasesCount: 3,
    explanation: 'Hardware signature correlated with suspect authentication sessions.',
    relatedItems: [
      { id: phoneNode.id, label: phoneNode.label, typeDesc: 'Mobile • used on', badge: phoneNode.badge, badgeType: 'success', iconType: 'mobile' }
    ]
  };

  const dynamicNodes: CorrelationGraphNode[] = [
    centerNode,
    domainNode,
    ipNode,
    phoneNode,
    emailNode,
    upiNode,
    suspectNode,
    docNode,
    deviceNode
  ];

  const dynamicEdges: CorrelationGraphEdge[] = [
    { id: 'de-1', sourceId: centerNode.id, targetId: domainNode.id, label: 'similar domain', style: 'solid-red', badgeColor: '#ff1744', verified: false },
    { id: 'de-2', sourceId: domainNode.id, targetId: ipNode.id, label: 'resolved to', style: 'solid-amber', badgeColor: '#a855f7', verified: true },
    { id: 'de-3', sourceId: centerNode.id, targetId: phoneNode.id, label: 'reported in', style: 'solid-green', badgeColor: '#10b981', verified: true },
    { id: 'de-4', sourceId: phoneNode.id, targetId: deviceNode.id, label: 'used on', style: 'solid-green', badgeColor: '#0ea5e9', verified: true },
    { id: 'de-5', sourceId: centerNode.id, targetId: emailNode.id, label: 'mentioned in', style: 'dashed-amber', badgeColor: '#f59e0b', verified: false },
    { id: 'de-6', sourceId: centerNode.id, targetId: upiNode.id, label: 'transaction to', style: 'solid-cyan', badgeColor: '#06b6d4', verified: true },
    { id: 'de-7', sourceId: centerNode.id, targetId: suspectNode.id, label: 'linked to', style: 'solid-pink', badgeColor: '#ec4899', verified: true },
    { id: 'de-8', sourceId: upiNode.id, targetId: suspectNode.id, label: 'linked to', style: 'solid-pink', badgeColor: '#ec4899', verified: true },
    { id: 'de-9', sourceId: centerNode.id, targetId: docNode.id, label: 'contains', style: 'solid-green', badgeColor: '#3b82f6', verified: true }
  ];

  // Connect correlated peer cases from platform as secondary constellation clusters
  relatedCases.forEach((peer, idx) => {
    const peerNode: CorrelationGraphNode = {
      id: `node-peer-${peer.id}`,
      label: peer.referenceNumber,
      sublabel: `Peer Case • ${peer.category}`,
      type: 'related-case',
      iconType: 'related-case',
      badge: 'RELATED CASE',
      badgeType: 'info',
      glowColor: '#0284c7',
      iconBg: '#082f49',
      iconColor: '#38bdf8',
      x: idx === 0 ? 145 : -145,
      y: idx === 0 ? 35 : -35,
      z: idx * 18,
      sourceProvenance: `Reported by ${peer.citizenName || 'Complainant'}`,
      firstSeen: peer.incidentDate || peer.reportedDate || 'Logged',
      lastSeen: peer.reportedDate || 'Active',
      statusText: `• ${peer.status}`,
      reputation: `Correlated peer docket sharing modus operandi (${peer.category})`,
      relatedCasesCount: 2,
      explanation: `Peer complaint docket on platform correlated via shared infrastructure and indicator overlap.`,
      relatedItems: [
        { id: centerNode.id, label: centerNode.label, typeDesc: 'Active Case • peer correlate', badge: 'ACTIVE CASE', badgeType: 'success', iconType: 'related-case' }
      ]
    };
    dynamicNodes.push(peerNode);
    dynamicEdges.push({
      id: `de-peer-${idx}`,
      sourceId: centerNode.id,
      targetId: peerNode.id,
      label: idx === 0 ? 'similar pattern' : 'syndicate match',
      style: 'dashed-amber',
      badgeColor: '#f59e0b',
      verified: false
    });
  });

  return {
    nodes: [...dynamicNodes, ...backgroundConstellationNodes],
    edges: [...dynamicEdges, ...backgroundConstellationEdges],
    defaultSelectedNodeId: domainNode.id
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

  // Camera 360-Degree Azimuth Tracking
  const [cameraAngleDeg, setCameraAngleDeg] = useState<number>(0);

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

  // Periodic Azimuth Angle Polling for 360° Compass & View Badge
  useEffect(() => {
    const interval = setInterval(() => {
      if (!fgRef.current) return;
      const camera = (fgRef.current as any).camera?.();
      if (!camera) return;
      const rad = Math.atan2(camera.position.x, camera.position.z);
      let deg = Math.round((rad * 180) / Math.PI);
      if (deg < 0) deg += 360;
      setCameraAngleDeg(deg);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  // Initial camera orientation and concentric holographic radar floor setup
  useEffect(() => {
    if (!fgRef.current) return;
    fgRef.current.d3Force('charge')?.strength(-800);
    fgRef.current.d3Force('link')?.distance(145);
    if ((fgRef.current as any).d3VelocityDecay) {
      (fgRef.current as any).d3VelocityDecay(0.28);
    }

    // Concentric Cyber Radar Ground Plane on X-Z plane (Phase 2 Spec)
    const scene = (fgRef.current as any).scene?.();
    if (scene && !scene.userData.hasCyberGrid) {
      scene.userData.hasCyberGrid = true;

      const radarGroup = new THREE.Group();
      radarGroup.position.y = -10;

      // 1. Cyber Ground Grid
      const gridHelper = new THREE.GridHelper(560, 28, 0x00e5ff, 0x051d12);
      (gridHelper.material as THREE.Material).transparent = true;
      (gridHelper.material as THREE.Material).opacity = 0.20;
      radarGroup.add(gridHelper);

      // 2. Three Primary Glowing Neon Cyan Rings at r = 70, 140, 210
      const ringRadii = [70, 140, 210, 280];
      ringRadii.forEach((r, idx) => {
        const ringGeo = new THREE.RingGeometry(r, r + (idx === 0 ? 1.6 : 1.2), 64);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00e5ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: idx === 0 ? 0.38 : 0.22 - idx * 0.04
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        radarGroup.add(ring);
      });

      // 3. Radial Coordinate Axes Lines
      const axisMat = new THREE.LineBasicMaterial({
        color: 0x00e5ff,
        transparent: true,
        opacity: 0.18
      });
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const points = [
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(Math.cos(angle) * 280, 0, Math.sin(angle) * 280)
        ];
        const geom = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geom, axisMat);
        radarGroup.add(line);
      }

      scene.add(radarGroup);
    }

    const timer = setTimeout(() => {
      if (fgRef.current) {
        fgRef.current.cameraPosition({ x: 0, y: 70, z: 275 }, { x: 0, y: 0, z: 0 }, 1000);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Preset Camera Angles (Phase 3 Spec)
  const applyCameraPreset = (preset: 'isometric' | 'front' | 'topdown' | 'suspect' | 'evidence') => {
    if (!fgRef.current) return;
    setIsAutoRotate(false);
    if (preset === 'isometric') {
      fgRef.current.cameraPosition({ x: 195, y: 135, z: 215 }, { x: 0, y: 0, z: 0 }, 1000);
      showToast('Switched to Isometric 3D View (45° elevation).');
    } else if (preset === 'front') {
      fgRef.current.cameraPosition({ x: 0, y: 65, z: 275 }, { x: 0, y: 0, z: 0 }, 1000);
      showToast('Switched to Front View (0° Default).');
    } else if (preset === 'topdown') {
      fgRef.current.cameraPosition({ x: 0, y: 340, z: 10 }, { x: 0, y: 0, z: 0 }, 1000);
      showToast('Switched to Top-Down Forensic Radar.');
    } else if (preset === 'suspect') {
      fgRef.current.cameraPosition({ x: 165, y: -20, z: 90 }, { x: 75, y: -25, z: 0 }, 1000);
      showToast('Camera focused on Threat Actor & Mule Network.');
    } else if (preset === 'evidence') {
      fgRef.current.cameraPosition({ x: -145, y: -45, z: 95 }, { x: -65, y: -30, z: 0 }, 1000);
      showToast('Camera focused on Evidence Vault & Documents.');
    }
  };

  const handleResetCamera = () => {
    applyCameraPreset('front');
  };

  const handleFitGraph = () => {
    if (!fgRef.current) return;
    fgRef.current.zoomToFit(800, 45);
    showToast('Fitted all correlation nodes to viewport.');
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
    showToast('Drag with mouse or right-click to orbit & pan in 3D.');
  };

  const handleNodeClick = (node: any) => {
    if (node.isConstellation) return;
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

  // Selected Node lookup (defaults to first satellite)
  const selectedNode = useMemo(() => {
    return nodes.find(n => n.id === selectedNodeId && !n.isConstellation) || nodes.find(n => !n.isConstellation) || nodes[0];
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

  // High-DPI Stylized Icon Canvas Textures for all 10 Entities (Phase 2 Spec)
  const createIconTexture = (iconType: string, color: string) => {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Glowing circle backing
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(7, 24, 15, 0.95)';
    ctx.fill();
    ctx.lineWidth = 6;
    ctx.strokeStyle = color;
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (iconType === 'case' || iconType === 'related-case') {
      // 3D Glowing Document Sheet
      ctx.beginPath();
      ctx.rect(38, 30, 52, 68);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(48, 48);
      ctx.lineTo(80, 48);
      ctx.moveTo(48, 62);
      ctx.lineTo(80, 62);
      ctx.moveTo(48, 76);
      ctx.lineTo(72, 76);
      ctx.stroke();
    } else if (iconType === 'domain' || iconType === 'url') {
      // Global Web Globe
      ctx.beginPath();
      ctx.arc(64, 64, 30, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(64, 64, 14, 30, 0, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(34, 64);
      ctx.lineTo(94, 64);
      ctx.stroke();
    } else if (iconType === 'ip') {
      // Map Pin / Geo Location Pin
      ctx.beginPath();
      ctx.arc(64, 52, 18, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(50, 62);
      ctx.lineTo(64, 94);
      ctx.lineTo(78, 62);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 52, 6, 0, 2 * Math.PI);
      ctx.fill();
    } else if (iconType === 'email') {
      // Envelope / Mail
      ctx.beginPath();
      ctx.rect(34, 42, 60, 44);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(34, 44);
      ctx.lineTo(64, 68);
      ctx.lineTo(94, 44);
      ctx.stroke();
    } else if (iconType === 'mobile') {
      // Phone Handset
      ctx.beginPath();
      ctx.rect(42, 30, 44, 68);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 88, 3.5, 0, 2 * Math.PI);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(54, 38);
      ctx.lineTo(74, 38);
      ctx.stroke();
    } else if (iconType === 'bank') {
      // Classical Bank Columns
      ctx.beginPath();
      ctx.moveTo(34, 44);
      ctx.lineTo(64, 30);
      ctx.lineTo(94, 44);
      ctx.closePath();
      ctx.stroke();
      ctx.rect(40, 48, 8, 36);
      ctx.rect(60, 48, 8, 36);
      ctx.rect(80, 48, 8, 36);
      ctx.stroke();
      ctx.fillRect(32, 86, 64, 6);
    } else if (iconType === 'card') {
      // Credit / Debit Card
      ctx.beginPath();
      ctx.rect(32, 40, 64, 48);
      ctx.stroke();
      ctx.fillRect(32, 50, 64, 8);
      ctx.strokeRect(42, 66, 12, 10);
    } else if (iconType === 'person') {
      // User / Threat Actor Silhouette
      ctx.beginPath();
      ctx.arc(64, 46, 15, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(64, 94, 26, Math.PI, 0);
      ctx.stroke();
    } else if (iconType === 'document') {
      // Document Sheet / PDF Document
      ctx.beginPath();
      ctx.rect(38, 30, 52, 68);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(46, 48);
      ctx.lineTo(82, 48);
      ctx.moveTo(46, 62);
      ctx.lineTo(82, 62);
      ctx.moveTo(46, 76);
      ctx.lineTo(70, 76);
      ctx.stroke();
    } else {
      // Laptop / Workstation
      ctx.beginPath();
      ctx.rect(38, 38, 52, 38);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(28, 82);
      ctx.lineTo(100, 82);
      ctx.stroke();
      ctx.fillRect(56, 82, 16, 4);
    }

    return new THREE.CanvasTexture(canvas);
  };

  // 3D Holographic Pedestal, Concentric Rings & Billboard Node Renderer
  const nodeThreeObject = useCallback((node: any) => {
    // 1. Subtle small rendering for ambient background constellation nodes
    if (node.isConstellation) {
      const constGeo = new THREE.SphereGeometry(2.4, 16, 16);
      const constMat = new THREE.MeshBasicMaterial({
        color: 0x1e4a30,
        transparent: true,
        opacity: 0.35
      });
      return new THREE.Mesh(constGeo, constMat);
    }

    const isSelected = node.id === selectedNodeId;
    const isHovered = node.id === hoveredNode?.id;
    const isCenter = node.badge === 'ACTIVE CASE' || node.type === 'case' || node.id === `node-${activeCaseId}`;

    const group = new THREE.Group();
    const radius = isCenter ? 14 : 9.5;
    const glowColor = node.glowColor || '#00e5ff';

    // 1. Concentric Holographic Ground Ripple Rings on horizontal plane
    const ringMat = new THREE.MeshBasicMaterial({
      color: glowColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: isSelected ? 0.95 : (isHovered ? 0.85 : 0.65)
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
      emissiveIntensity: isSelected ? 0.9 : 0.55,
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

    // 5. Camera-Facing SpriteText Label Card matching screenshot typography
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
    sprite.borderColor = isSelected ? '#00e5ff' : glowColor;
    sprite.borderWidth = isSelected ? 1.4 : 0.8;
    sprite.borderRadius = 4;
    sprite.padding = [2.5, 5];
    group.add(sprite);

    return group;
  }, [selectedNodeId, hoveredNode, activeCaseId]);

  // Floating Edge Badge Pill Renderer (`linkThreeObject`)
  const linkThreeObject = useCallback((link: any): THREE.Object3D => {
    if (!link.label) return new THREE.Object3D();
    const sprite = new SpriteText(link.label);
    sprite.color = '#FFFFFF';
    sprite.textHeight = 3.2;
    sprite.fontFace = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
    sprite.fontWeight = 'bold';
    sprite.backgroundColor = link.style === 'solid-red' ? 'rgba(90, 12, 18, 0.95)' : 'rgba(9, 24, 15, 0.95)';
    sprite.borderColor = link.badgeColor || (link.style === 'solid-red' ? '#ff1744' : '#f59e0b');
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
    if (link.style === 'dashed-grey') return 'rgba(30, 74, 48, 0.25)';
    if (link.style === 'solid-green' || link.verified) return '#10b981';
    if (link.style === 'solid-red') return '#ff1744';
    if (link.style === 'solid-cyan') return '#06b6d4';
    if (link.style === 'solid-pink') return '#ec4899';
    return '#f59e0b';
  }, []);

  const getLinkWidth = useCallback((link: any) => {
    if (link.style === 'dashed-grey') return 0.6;
    if (link.style === 'solid-green' || link.verified) return 2.6;
    if (link.style === 'solid-red') return 2.4;
    return 1.8;
  }, []);

  // Compute Azimuth View Label
  const getViewLabel = (deg: number) => {
    if (deg >= 338 || deg < 23) return 'FRONT VIEW (0°)';
    if (deg >= 23 && deg < 68) return 'FRONT-RIGHT VIEW (45°)';
    if (deg >= 68 && deg < 113) return 'RIGHT PROFILE (90°)';
    if (deg >= 113 && deg < 158) return 'REAR-RIGHT VIEW (135°)';
    if (deg >= 158 && deg < 203) return 'REAR VIEW (180°)';
    if (deg >= 203 && deg < 248) return 'REAR-LEFT VIEW (225°)';
    if (deg >= 248 && deg < 293) return 'LEFT PROFILE (270°)';
    return 'FRONT-LEFT VIEW (315°)';
  };

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
          <div className="w-9 h-9 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center shrink-0 shadow-[0_0_12px_rgba(0,229,255,0.2)]">
            <Share2 className="w-5 h-5 text-[#00e5ff]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              Cross-Case Correlation & Validation Graph
            </h1>
            <p className="text-xs text-content-muted font-sans mt-0.5">
              3D forensic intelligence network linking cases, indicators, and cross-jurisdictional threat dockets in real time.
            </p>
          </div>
        </div>

        {/* Active-Case Selector Dropdown */}
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
        {/* LEFT 3D GRAPH CANVAS (8 Columns)                                          */}
        {/* ========================================================================= */}
        <div className="lg:col-span-8 xl:col-span-8 flex flex-col gap-3">
          <div
            ref={containerRef}
            className="relative w-full h-[680px] rounded-2xl bg-[#020805] border border-primary/20 overflow-hidden shadow-2xl flex flex-col justify-between select-none"
          >
            {/* Cyber Grid Background */}
            <div 
              className="absolute inset-0 pointer-events-none opacity-25 z-0"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0, 229, 255, 0.08) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0, 229, 255, 0.08) 1px, transparent 1px)
                `,
                backgroundSize: '40px 40px'
              }}
            />

            {/* Top-Left View Indicator matching 360° Reference Images */}
            <div className="absolute top-4 left-4 z-20 pointer-events-auto bg-[#041109]/92 backdrop-blur-md border border-[#00e5ff]/30 rounded-xl p-3 shadow-2xl font-mono">
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-wider">{cameraAngleDeg}°</span>
                <span className="text-xs font-bold text-[#00e5ff] uppercase tracking-wider">{getViewLabel(cameraAngleDeg)}</span>
              </div>
              <p className="text-[10px] text-content-muted mt-0.5">Facing the main case node</p>
              <span className="text-[9px] text-[#00e5ff]/80">(360° Interactive Orbit)</span>
            </div>

            {/* Top-Right 3D Coordinate Compass Gizmo matching Reference Images */}
            <div className="absolute top-4 right-4 z-20 pointer-events-auto bg-[#041109]/90 backdrop-blur-md border border-white/10 rounded-full w-20 h-20 shadow-2xl flex items-center justify-center p-1">
              <svg className="w-16 h-16" viewBox="-32 -32 64 64">
                <circle cx="0" cy="0" r="28" fill="none" stroke="rgba(0, 229, 255, 0.25)" strokeWidth="1" strokeDasharray="2,2" />
                <circle cx="0" cy="0" r="14" fill="none" stroke="rgba(0, 229, 255, 0.15)" strokeWidth="0.8" />
                
                {/* Y Axis (Up - Cyan) */}
                <line x1="0" y1="0" x2={0} y2={-22} stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
                <text x="0" y="-24" fill="#00e5ff" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Y</text>
                
                {/* X Axis (Rotated - Amber) */}
                <line x1="0" y1="0" x2={Math.cos(-cameraAngleDeg * Math.PI / 180) * 20} y2={Math.sin(-cameraAngleDeg * Math.PI / 180) * 8} stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                <text x={Math.cos(-cameraAngleDeg * Math.PI / 180) * 24} y={Math.sin(-cameraAngleDeg * Math.PI / 180) * 8 + 3} fill="#f59e0b" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">X</text>
                
                {/* Z Axis (Depth - Purple) */}
                <line x1="0" y1="0" x2={-Math.sin(-cameraAngleDeg * Math.PI / 180) * 18} y2={Math.cos(-cameraAngleDeg * Math.PI / 180) * 14} stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
                <text x={-Math.sin(-cameraAngleDeg * Math.PI / 180) * 22} y={Math.cos(-cameraAngleDeg * Math.PI / 180) * 14 + 3} fill="#a855f7" fontSize="7" fontWeight="bold" textAnchor="middle" fontFamily="monospace">Z</text>
                
                {/* Center Core */}
                <circle cx="0" cy="0" r="3.5" fill="#00e5ff" />
                <circle cx="0" cy="0" r="6" fill="none" stroke="#00e5ff" strokeWidth="1" opacity="0.6" />
              </svg>
            </div>

            {/* WebGL 3D Force Directed Graph */}
            <ForceGraph3D
              ref={fgRef as any}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData3D}
              backgroundColor="#020805"
              nodeThreeObject={nodeThreeObject}
              nodeLabel={() => ''}
              onNodeClick={(node: any) => handleNodeClick(node)}
              onNodeHover={(node: any) => setHoveredNode(node || null)}
              linkColor={getLinkColor}
              linkWidth={getLinkWidth}
              linkOpacity={0.8}
              linkCurvature={0.06}
              linkDirectionalParticles={4}
              linkDirectionalParticleWidth={2.6}
              linkDirectionalParticleSpeed={0.008}
              linkDirectionalParticleColor={getLinkColor}
              linkThreeObjectExtend={true}
              linkThreeObject={linkThreeObject}
              linkPositionUpdate={linkPositionUpdate}
              enableNodeDrag={true}
              showNavInfo={false}
            />

            {/* Bottom Overlay Row: Legend (Left), Presets & Controls (Right) */}
            <div className="relative z-10 w-full p-4 flex flex-wrap items-end justify-between gap-3 pointer-events-none">
              
              {/* Bottom-Left Node Type Legend matching Reference Images */}
              <div className="pointer-events-auto bg-[#041109]/92 backdrop-blur-md border border-white/10 rounded-xl p-3 shadow-2xl flex flex-col gap-1.5 font-mono text-[11px] min-w-[200px]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-content-muted pb-0.5 border-b border-white/10">Entity Classifications</span>
                
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] shadow-[0_0_6px_#00e5ff]" />
                  <span className="text-white text-xs">Case (Main Node)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff1744] shadow-[0_0_6px_#ff1744]" />
                  <span className="text-white text-xs">Domain / URL</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#a855f7] shadow-[0_0_6px_#a855f7]" />
                  <span className="text-white text-xs">IP Address</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_6px_#f59e0b]" />
                  <span className="text-white text-xs">Email / Bank Account</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-[0_0_6px_#10b981]" />
                  <span className="text-white text-xs">Mobile Number</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#06b6d4] shadow-[0_0_6px_#06b6d4]" />
                  <span className="text-white text-xs">UPI ID (Bank Columns)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ec4899] shadow-[0_0_6px_#ec4899]" />
                  <span className="text-white text-xs">Suspected Actor (User)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_6px_#3b82f6]" />
                  <span className="text-white text-xs">Document Sheet (PDF)</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0ea5e9] shadow-[0_0_6px_#0ea5e9]" />
                  <span className="text-white text-xs">Device / Workstation</span>
                </div>
              </div>

              {/* Bottom-Right Camera Presets and Controls */}
              <div className="pointer-events-auto flex flex-col items-end gap-2">
                {/* Preset View Selector Bar */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-[#041209]/95 backdrop-blur-md border border-white/10 font-mono text-[11px] shadow-2xl">
                  <span className="text-[10px] text-content-muted px-2 font-bold uppercase tracking-wider">Presets:</span>
                  <button
                    onClick={() => applyCameraPreset('isometric')}
                    className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition-all text-content-secondary cursor-pointer"
                  >
                    Isometric
                  </button>
                  <button
                    onClick={() => applyCameraPreset('front')}
                    className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition-all text-content-secondary cursor-pointer"
                  >
                    Front (0°)
                  </button>
                  <button
                    onClick={() => applyCameraPreset('topdown')}
                    className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition-all text-content-secondary cursor-pointer"
                  >
                    Top-Down
                  </button>
                  <button
                    onClick={() => applyCameraPreset('suspect')}
                    className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition-all text-content-secondary cursor-pointer"
                  >
                    Suspect
                  </button>
                  <button
                    onClick={() => applyCameraPreset('evidence')}
                    className="px-2.5 py-1 rounded-lg hover:text-white hover:bg-white/5 transition-all text-content-secondary cursor-pointer"
                  >
                    Evidence
                  </button>
                </div>

                {/* Main 4-Action Navigation Dock */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#041209]/95 backdrop-blur-md border border-white/15 shadow-2xl font-mono text-xs">
                  {/* Rotate Button */}
                  <button
                    onClick={() => {
                      setIsAutoRotate(prev => !prev);
                      showToast(isAutoRotate ? 'Orbit rotation paused.' : 'Orbit rotation active.');
                    }}
                    className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 transition-all cursor-pointer ${
                      isAutoRotate
                        ? 'bg-[#00e5ff]/20 text-[#00e5ff] border border-[#00e5ff]/50 font-bold shadow-[0_0_10px_rgba(0,229,255,0.2)]'
                        : 'text-content-secondary hover:text-white hover:bg-white/5'
                    }`}
                    title="Toggle 360° Auto-Rotate"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Rotate</span>
                  </button>

                  {/* Zoom */}
                  <button
                    onClick={handleZoom}
                    className="px-3 py-1.5 rounded-full text-content-secondary hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom</span>
                  </button>

                  {/* Pan */}
                  <button
                    onClick={handlePan}
                    className="px-3 py-1.5 rounded-full text-content-secondary hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Pan Camera"
                  >
                    <Move className="w-3.5 h-3.5" />
                    <span>Pan</span>
                  </button>

                  {/* Fit View */}
                  <button
                    onClick={handleFitGraph}
                    className="px-3 py-1.5 rounded-full text-content-secondary hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Fit All Nodes"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fit View</span>
                  </button>

                  {/* Reset */}
                  <button
                    onClick={handleResetCamera}
                    className="px-3 py-1.5 rounded-full text-content-secondary hover:text-white hover:bg-white/5 flex items-center gap-1.5 transition-all cursor-pointer"
                    title="Reset to 0° Front View"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>
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
                Forensic Node Details
              </span>
              <button 
                onClick={() => setSelectedNodeId(currentGraph.defaultSelectedNodeId)}
                className="text-content-muted hover:text-white transition-colors cursor-pointer"
                title="Reset to default node"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Selected Node Summary Card */}
            <div className="flex items-center gap-3.5">
              <div 
                className="w-13 h-13 rounded-full flex items-center justify-center shrink-0 border-2"
                style={{
                  backgroundColor: selectedNode.iconBg,
                  borderColor: selectedNode.glowColor,
                  boxShadow: `0 0 16px ${selectedNode.glowColor}50`
                }}
              >
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
                    </svg>
                  )}
                  {selectedNode.type === 'card' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                      <line x1="1" y1="10" x2="23" y2="10"/>
                    </svg>
                  )}
                  {selectedNode.type === 'person' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <circle cx="12" cy="7" r="4"/>
                      <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                    </svg>
                  )}
                  {selectedNode.type === 'document' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                      <polyline points="14 2 14 8 20 8"/>
                      <line x1="16" y1="13" x2="8" y2="13"/>
                    </svg>
                  )}
                  {selectedNode.type === 'device' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                      <line x1="8" y1="21" x2="16" y2="21"/>
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

                <div className="text-xs text-content-muted mt-0.5 truncate">
                  {selectedNode.sublabel}
                </div>

                <div className="mt-1.5">
                  <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                    selectedNode.badge.includes('MALICIOUS') || selectedNode.badge.includes('FLAGGED') ? 'bg-[#ff1744] text-white' :
                    selectedNode.badge.includes('Seen in') || selectedNode.badge === 'VERIFIED' ? 'bg-[#10b981] text-[#020b06]' :
                    selectedNode.badge === 'ACTIVE CASE' ? 'bg-[#00e5ff] text-[#020b06]' :
                    selectedNode.badge.includes('Multiple') ? 'bg-[#ec4899] text-white' :
                    selectedNode.badge === 'PDF Document' ? 'bg-[#3b82f6] text-white' :
                    'bg-[#f59e0b] text-[#020b06]'
                  }`}>
                    {selectedNode.badge}
                  </span>
                </div>
              </div>
            </div>

            {/* Metadata Key-Value List */}
            <div className="flex flex-col gap-2.5 text-xs pt-1">
              <div className="flex items-center justify-between">
                <span className="text-content-muted">Type</span>
                <span className="text-white font-medium">{selectedNode.sublabel}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-content-muted">Value</span>
                <span className="text-white font-mono truncate max-w-[200px]">{selectedNode.label}</span>
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
                  selectedNode.badge.includes('MALICIOUS') || selectedNode.badge.includes('FLAGGED') ? 'text-[#ff1744]' :
                  selectedNode.badge.includes('Seen in') ? 'text-[#10b981]' :
                  selectedNode.badge === 'ACTIVE CASE' ? 'text-[#00e5ff]' :
                  selectedNode.badge.includes('Multiple') ? 'text-[#ec4899]' :
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

            {/* Forensic Explanation */}
            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[0.08]">
              <span className="text-xs font-bold text-white">Forensic Assessment</span>
              <div className="p-3 rounded-xl bg-[#08180e] border border-white/[0.06] text-xs text-content-secondary leading-relaxed">
                {selectedNode.explanation}
              </div>
            </div>

            {/* Related Items */}
            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.08]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white">
                  Correlated Items ({selectedNode.relatedItems.length})
                </span>
                <button 
                  onClick={() => showToast('Displaying all correlated entities in active docket.')}
                  className="text-xs font-medium text-[#00e5ff] hover:underline cursor-pointer"
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
                        item.iconType === 'ip' ? 'bg-[#371014] text-[#a855f7] border-[#a855f7]/30' :
                        item.iconType === 'related-case' ? 'bg-[#082f49] text-[#00e5ff] border-[#00e5ff]/30' :
                        item.iconType === 'email' ? 'bg-[#31104a] text-[#f59e0b] border-[#f59e0b]/30' :
                        item.iconType === 'person' ? 'bg-[#3b0d26] text-[#ec4899] border-[#ec4899]/30' :
                        item.iconType === 'card' ? 'bg-[#38250b] text-[#f59e0b] border-[#f59e0b]/30' :
                        item.iconType === 'document' ? 'bg-[#1e3a8a] text-[#3b82f6] border-[#3b82f6]/30' :
                        item.iconType === 'domain' ? 'bg-[#371014] text-[#ff1744] border-[#ff1744]/30' :
                        'bg-[#052e16] text-[#10b981] border-[#10b981]/30'
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
                        {item.iconType === 'email' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
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
                            <polyline points="5 6 12 3 19 6"/>
                          </svg>
                        )}
                        {item.iconType === 'card' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                          </svg>
                        )}
                        {item.iconType === 'person' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <circle cx="12" cy="7" r="4"/>
                            <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                          </svg>
                        )}
                        {item.iconType === 'document' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          </svg>
                        )}
                        {item.iconType === 'device' && (
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
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
                      item.badge.includes('MALICIOUS') || item.badge.includes('FLAGGED') ? 'bg-[#ff1744] text-white' :
                      item.badge.includes('Seen in') ? 'bg-[#10b981] text-[#020b06]' :
                      item.badge === 'ACTIVE CASE' ? 'bg-[#00e5ff] text-[#020b06]' :
                      item.badge.includes('Multiple') ? 'bg-[#ec4899] text-white' :
                      'bg-[#b45309] text-white'
                    }`}>
                      {item.badge}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Primary Action Button */}
            <div className="pt-2 border-t border-white/[0.08]">
              <button
                onClick={() => {
                  onSelectCase?.(activeCaseId);
                  onSelectTab('investigation-workspace');
                  showToast('Navigating to Investigation Workspace for active docket.');
                }}
                className="w-full py-3 rounded-xl bg-[#062414] hover:bg-[#0c3920] border border-[#00e5ff] text-[#00e5ff] font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(0,229,255,0.2)] transition-all cursor-pointer"
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
