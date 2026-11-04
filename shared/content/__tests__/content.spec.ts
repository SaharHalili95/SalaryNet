import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { angularFeatures, angularFlows, angularLanes, angularNodes, angularScope } from '../angular'
import { flows, nodes } from '../architecture'
import type { Localized } from '../localized'
import { componentDetails } from '../components'
import { glossary } from '../glossary'
import { summarySections } from '../projectSummary'
import { issues } from '../troubleshooting'
import { lanes } from '../architecture'

const repoRoot = resolve(__dirname, '../../..')
const bothLanguages = (text: Localized) => text.en.trim().length > 0 && text.he.trim().length > 0

describe('architecture content', () => {
  it('every flow step points at a node on the diagram', () => {
    const ids = new Set(nodes.map((n) => n.id))
    for (const flow of flows) {
      for (const step of flow.steps) expect(ids.has(step.node), `${flow.id} -> ${step.node}`).toBe(true)
    }
  })

  it('is fully written in English and Hebrew', () => {
    for (const flow of flows) {
      expect(bothLanguages(flow.title) && bothLanguages(flow.summary), flow.id).toBe(true)
      for (const step of flow.steps) expect(bothLanguages(step.text), `${flow.id}: ${step.text.en}`).toBe(true)
    }
    for (const node of nodes) expect(bothLanguages(node.label) && bothLanguages(node.plain), node.id).toBe(true)
    for (const lane of lanes) expect(bothLanguages(lane.analogy), lane.id).toBe(true)
    for (const g of glossary) expect(bothLanguages(g.meaning), g.term).toBe(true)
    for (const node of nodes) {
      const d = componentDetails[node.id]
      expect(d.tech.length > 0 && [d.job, d.from, d.to, d.how].every(bothLanguages), node.id).toBe(true)
    }
  })

  // The guides cite real files; this keeps them honest when code moves.
  it('only cites code paths that exist in the repository', () => {
    for (const node of nodes) expect(existsSync(resolve(repoRoot, node.code)), node.code).toBe(true)
  })
})

describe('troubleshooting content', () => {
  it('has unique ids and complete translations', () => {
    expect(new Set(issues.map((i) => i.id)).size).toBe(issues.length)
    for (const issue of issues) {
      const texts = [issue.title, issue.symptom, issue.cause, ...issue.fix]
      expect(texts.every(bothLanguages), issue.id).toBe(true)
      expect(issue.fix.length, issue.id).toBeGreaterThan(0)
    }
  })

  it('only cites code paths that exist in the repository', () => {
    for (const issue of issues.filter((i) => i.code)) {
      expect(existsSync(resolve(repoRoot, issue.code!)), issue.code).toBe(true)
    }
  })
})

describe('project summary content', () => {
  it('is fully written in English and Hebrew', () => {
    for (const section of summarySections) {
      expect(bothLanguages(section.title), section.id).toBe(true)
      expect(section.items.every(bothLanguages), section.id).toBe(true)
    }
  })
})

describe('angular guide content', () => {
  it('keeps the shared diagram and flows, changing only the browser side', () => {
    expect(angularNodes.map((n) => n.id)).toEqual(nodes.map((n) => n.id))
    expect(angularFlows.map((f) => f.steps.length)).toEqual(flows.map((f) => f.steps.length))
    expect(angularLanes[0]!.title.en).toContain('Angular')
  })

  it('is fully written in English and Hebrew', () => {
    for (const feature of angularFeatures) expect(bothLanguages(feature.title) && bothLanguages(feature.text), feature.id).toBe(true)
    expect(angularScope.every(bothLanguages)).toBe(true)
    for (const flow of angularFlows) for (const step of flow.steps) expect(bothLanguages(step.text), flow.id).toBe(true)
  })

  it('only cites code paths that exist in the repository', () => {
    for (const node of angularNodes) expect(existsSync(resolve(repoRoot, node.code)), node.code).toBe(true)
    for (const feature of angularFeatures) expect(existsSync(resolve(repoRoot, feature.code)), feature.code).toBe(true)
  })
})
