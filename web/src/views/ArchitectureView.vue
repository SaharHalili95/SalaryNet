<script setup lang="ts">
import Button from 'primevue/button'
import SelectButton from 'primevue/selectbutton'
import Tag from 'primevue/tag'
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { isDemoMode } from '@/api'
import { flows, lanes, nodes, type DiagramNode, type NodeId } from '@shared/content/architecture'
import { componentDetails } from '@shared/content/components'
import { glossary } from '@shared/content/glossary'
import { pick } from '@shared/content/localized'
import type { Locale } from '@/i18n'

const { t, locale } = useI18n()
const lang = computed(() => locale.value as Locale)
const rtl = computed(() => lang.value === 'he')

/* Diagram geometry (SVG user units). */
const LANE_WIDTH = 180
const NODE_WIDTH = 156
const NODE_HEIGHT = 44
const ROW_HEIGHT = 62
const TOP = 64
const WIDTH = LANE_WIDTH * lanes.length
const HEIGHT = TOP + ROW_HEIGHT * 5 + 8

const laneX = (lane: number) => (rtl.value ? lanes.length - 1 - lane : lane) * LANE_WIDTH
const nodeBox = (node: DiagramNode) => ({
  x: laneX(node.lane) + (LANE_WIDTH - NODE_WIDTH) / 2,
  y: TOP + node.row * ROW_HEIGHT,
})
const byId = new Map(nodes.map((n) => [n.id, n]))

/* Flow playback */
const flowOptions = computed(() => flows.map((f) => ({ value: f.id, label: pick(f.title, lang.value) })))
const flowId = ref(flows[0]!.id)
const flow = computed(() => flows.find((f) => f.id === flowId.value)!)
const stepIndex = ref(0)
const step = computed(() => flow.value.steps[stepIndex.value]!)
const activeNode = computed(() => byId.get(step.value.node)!)
const visited = computed(() => new Set<NodeId>(flow.value.steps.slice(0, stepIndex.value + 1).map((s) => s.node)))
const involved = computed(() => new Set<NodeId>(flow.value.steps.map((s) => s.node)))

/** A box the reader clicked; otherwise the card follows the step being played. */
const pinned = ref<NodeId | null>(null)
const detailNode = computed(() => byId.get(pinned.value ?? activeNode.value.id)!)
const detail = computed(() => componentDetails[detailNode.value.id])
function pin(id: NodeId) {
  stop()
  pinned.value = pinned.value === id ? null : id
}

/** The edge into the current step, drawn from the previous step's node. */
const arrow = computed(() => {
  if (stepIndex.value === 0) return null
  const from = byId.get(flow.value.steps[stepIndex.value - 1]!.node)!
  const to = activeNode.value
  if (from.id === to.id) return null
  const a = nodeBox(from)
  const b = nodeBox(to)
  const ax = a.x + NODE_WIDTH / 2
  const ay = a.y + NODE_HEIGHT / 2
  const bx = b.x + NODE_WIDTH / 2
  const by = b.y + NODE_HEIGHT / 2
  // Start and end on the box edges facing each other so the arrowhead stays visible.
  const dx = bx - ax
  const dy = by - ay
  const edge = (cx: number, cy: number, sx: number, sy: number) => {
    const scale = Math.min(Math.abs(NODE_WIDTH / 2 / (sx || 1e-9)), Math.abs(NODE_HEIGHT / 2 / (sy || 1e-9)))
    return { x: cx + sx * scale, y: cy + sy * scale }
  }
  const start = edge(ax, ay, dx, dy)
  const end = edge(bx, by, -dx, -dy)
  return { x1: start.x, y1: start.y, x2: end.x, y2: end.y }
})

const playing = ref(false)
let timer: ReturnType<typeof setInterval> | undefined

function stop() {
  playing.value = false
  clearInterval(timer)
}

function play() {
  if (stepIndex.value === flow.value.steps.length - 1) stepIndex.value = 0
  playing.value = true
  timer = setInterval(() => {
    if (stepIndex.value < flow.value.steps.length - 1) stepIndex.value++
    else stop()
  }, 2200)
}

function go(delta: number) {
  stop()
  pinned.value = null
  stepIndex.value = Math.min(Math.max(stepIndex.value + delta, 0), flow.value.steps.length - 1)
}

function select(index: number) {
  stop()
  pinned.value = null
  stepIndex.value = index
}

watch(flowId, () => {
  stop()
  pinned.value = null
  stepIndex.value = 0
})
onBeforeUnmount(stop)

const dockerRows = [
  { key: 'live', needs: false },
  { key: 'local', needs: true },
  { key: 'integration', needs: true },
  { key: 'unit', needs: false },
  { key: 'demo', needs: false },
]

/* Layer overview: dependencies point inward. */
// The flex row already mirrors in RTL, so the order stays Browser → API → Application → Domain in both languages.
const layerChain = [lanes[0]!, lanes[1]!, lanes[2]!, lanes[3]!]
</script>

<template>
  <div>
    <div class="page-header">
      <div>
        <h1>{{ t('architecture.title') }}</h1>
        <p>{{ t('architecture.subtitle') }}</p>
      </div>
    </div>

    <section class="panel plain">
      <h2>{{ t('architecture.plainTitle') }}</h2>
      <p class="muted">{{ t('architecture.plainIntro') }}</p>
      <ol class="analogy">
        <li v-for="(lane, i) in lanes" :key="lane.id">
          <span class="badge">{{ i + 1 }}</span>
          <span>
            <strong>{{ pick(lane.title, lang) }}</strong>
            <span class="muted">{{ pick(lane.analogy, lang) }}</span>
          </span>
        </li>
      </ol>
    </section>

    <section class="panel layers">
      <h2>{{ t('architecture.layersTitle') }}</h2>
      <div class="chain">
        <template v-for="(lane, i) in layerChain" :key="lane.id">
          <div class="layer" :class="{ core: lane.id === 'domain' }">{{ pick(lane.title, lang) }}</div>
          <i v-if="i < layerChain.length - 1" :class="rtl ? 'pi pi-arrow-left' : 'pi pi-arrow-right'" aria-hidden="true" />
        </template>
        <div class="layer infra">
          {{ pick(lanes[4]!.title, lang) }}
          <small>{{ t('architecture.implements') }} {{ pick(lanes[2]!.title, lang) }}</small>
        </div>
      </div>
      <p class="muted">{{ t('architecture.layersText') }}</p>
    </section>

    <section class="panel">
      <h2>{{ t('architecture.flowsTitle') }}</h2>
      <SelectButton v-model="flowId" :options="flowOptions" option-label="label" option-value="value" :allow-empty="false"
        class="flow-picker" :aria-label="t('architecture.flowsTitle')" />

      <div class="flow-head">
        <code class="request">{{ flow.request }}</code>
        <p>{{ pick(flow.summary, lang) }}</p>
      </div>

      <div class="diagram-scroll">
        <svg :viewBox="`0 0 ${WIDTH} ${HEIGHT}`" role="img" :aria-label="t('architecture.diagramLabel')" class="diagram">
          <defs>
            <marker id="arrowhead" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" class="arrowhead" />
            </marker>
          </defs>

          <g v-for="(lane, i) in lanes" :key="lane.id">
            <rect :x="laneX(i) + 4" y="4" :width="LANE_WIDTH - 8" :height="HEIGHT - 8" rx="10" class="lane" />
            <text :x="laneX(i) + LANE_WIDTH / 2" y="34" text-anchor="middle" class="lane-title">{{ pick(lane.title, lang) }}</text>
          </g>

          <line v-if="arrow" :key="`${flowId}-${stepIndex}`" :x1="arrow.x1" :y1="arrow.y1" :x2="arrow.x2" :y2="arrow.y2"
            class="edge" marker-end="url(#arrowhead)" />

          <g v-for="node in nodes" :key="node.id" role="button" tabindex="0" :aria-label="pick(node.label, lang)"
            :class="['node', { active: node.id === activeNode.id, visited: visited.has(node.id), idle: !involved.has(node.id), pinned: node.id === pinned }]"
            @click="pin(node.id)" @keydown.enter.prevent="pin(node.id)" @keydown.space.prevent="pin(node.id)">
            <rect :x="nodeBox(node).x" :y="nodeBox(node).y" :width="NODE_WIDTH" :height="NODE_HEIGHT" rx="8" />
            <text :x="nodeBox(node).x + NODE_WIDTH / 2" :y="nodeBox(node).y + NODE_HEIGHT / 2 + 5" text-anchor="middle">
              {{ pick(node.label, lang) }}
            </text>
          </g>
        </svg>
      </div>

      <p class="muted hint"><i class="pi pi-hand-pointer" /> {{ t('architecture.clickHint') }}</p>

      <article class="detail" aria-live="polite">
        <header>
          <h3>{{ pick(detailNode.label, lang) }}</h3>
          <code>{{ detail.tech }}</code>
        </header>
        <dl>
          <dt>{{ t('architecture.detailJob') }}</dt><dd>{{ pick(detail.job, lang) }}</dd>
          <dt>{{ t('architecture.detailFrom') }}</dt><dd>{{ pick(detail.from, lang) }}</dd>
          <dt>{{ t('architecture.detailTo') }}</dt><dd>{{ pick(detail.to, lang) }}</dd>
          <dt>{{ t('architecture.detailHow') }}</dt><dd>{{ pick(detail.how, lang) }}</dd>
          <dt>{{ t('architecture.code') }}</dt><dd><code class="path">{{ detailNode.code }}</code></dd>
        </dl>
      </article>

      <div class="controls">
        <Button :icon="rtl ? 'pi pi-chevron-right' : 'pi pi-chevron-left'" :label="t('architecture.previous')" text
          :disabled="stepIndex === 0" @click="go(-1)" />
        <Button :icon="playing ? 'pi pi-pause' : 'pi pi-play'" :label="playing ? t('architecture.pause') : t('architecture.play')"
          @click="playing ? stop() : play()" />
        <Button :icon="rtl ? 'pi pi-chevron-left' : 'pi pi-chevron-right'" icon-pos="right" :label="t('architecture.next')" text
          :disabled="stepIndex === flow.steps.length - 1" @click="go(1)" />
        <span class="muted step-count">{{ t('architecture.step', { current: stepIndex + 1, total: flow.steps.length }) }}</span>
      </div>

      <ol class="steps">
        <li v-for="(s, i) in flow.steps" :key="i" :class="{ current: i === stepIndex, done: i < stepIndex }">
          <button type="button" @click="select(i)">
            <span class="badge">{{ i + 1 }}</span>
            <span class="step-text">
              <strong>{{ pick(byId.get(s.node)!.label, lang) }}</strong>
              <span>{{ pick(s.text, lang) }}</span>
              <span v-if="i === stepIndex" class="plain-note">
                <i class="pi pi-info-circle" /> {{ t('architecture.whatIsIt') }} {{ pick(byId.get(s.node)!.plain, lang) }}
              </span>
              <code v-if="i === stepIndex" class="code-path">{{ t('architecture.code') }}: {{ byId.get(s.node)!.code }}</code>
            </span>
          </button>
        </li>
      </ol>

      <p v-if="isDemoMode" class="muted demo-note"><Tag severity="info" value="Demo" /> {{ t('architecture.demoNote') }}</p>
    </section>

    <section class="panel hosting">
      <h2>{{ t('architecture.hostingTitle') }}</h2>
      <p class="muted">{{ t('architecture.hostingIntro') }}</p>
      <ol class="hosting-steps">
        <li v-for="n in 4" :key="n"><span class="badge">{{ n }}</span><span>{{ t(`architecture.hostingStep${n}`) }}</span></li>
      </ol>

      <h3>{{ t('architecture.hostingDesignTitle') }}</h3>
      <div class="impls">
        <div class="impl iface"><code>SalaryNetApi</code></div>
        <div class="impl-pair">
          <div class="impl"><code>httpApi.ts</code><span>{{ t('architecture.hostingHttp') }}</span></div>
          <div class="impl demo"><code>demoApi.ts</code><span>{{ t('architecture.hostingDemo') }}</span></div>
        </div>
      </div>
      <p class="muted">{{ t('architecture.hostingDesignNote') }}</p>
      <p class="honest"><i class="pi pi-info-circle" /> {{ t('architecture.hostingHonest') }}</p>

      <h3>{{ t('architecture.dockerTitle') }}</h3>
      <table class="docker">
        <thead><tr><th>{{ t('architecture.dockerWhat') }}</th><th>{{ t('architecture.dockerNeeds') }}</th></tr></thead>
        <tbody>
          <tr v-for="row in dockerRows" :key="row.key">
            <td>{{ t(`architecture.dockerRows.${row.key}`) }}</td>
            <td><Tag :severity="row.needs ? 'warn' : 'success'" :value="row.needs ? t('architecture.dockerYes') : t('architecture.dockerNo')" /></td>
          </tr>
        </tbody>
      </table>
      <p class="muted">{{ t('architecture.dockerNote') }}</p>
    </section>

    <section class="panel catalog">
      <h2>{{ t('architecture.catalogTitle') }}</h2>
      <p class="muted">{{ t('architecture.catalogIntro') }}</p>
      <div class="cards">
        <article v-for="node in nodes" :key="node.id" class="card">
          <header>
            <span class="lane-chip">{{ pick(lanes[node.lane]!.title, lang) }}</span>
            <h3>{{ pick(node.label, lang) }}</h3>
            <code>{{ componentDetails[node.id].tech }}</code>
          </header>
          <dl>
            <dt>{{ t('architecture.detailJob') }}</dt><dd>{{ pick(componentDetails[node.id].job, lang) }}</dd>
            <dt>{{ t('architecture.detailFrom') }}</dt><dd>{{ pick(componentDetails[node.id].from, lang) }}</dd>
            <dt>{{ t('architecture.detailTo') }}</dt><dd>{{ pick(componentDetails[node.id].to, lang) }}</dd>
            <dt>{{ t('architecture.detailHow') }}</dt><dd>{{ pick(componentDetails[node.id].how, lang) }}</dd>
          </dl>
        </article>
      </div>
    </section>

    <section class="panel glossary">
      <h2>{{ t('architecture.glossaryTitle') }}</h2>
      <p class="muted">{{ t('architecture.glossaryIntro') }}</p>
      <dl>
        <template v-for="g in glossary" :key="g.term">
          <dt dir="ltr">{{ g.term }}</dt>
          <dd>{{ pick(g.meaning, lang) }}</dd>
        </template>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.plain, .layers { margin-bottom: 1rem; }
.plain > p { margin: 0 0 0.75rem; line-height: 1.6; }
.analogy { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(min(240px, 100%), 1fr)); gap: 0.75rem; }
.analogy li { display: flex; gap: 0.75rem; align-items: flex-start; padding: 0.75rem; border: 1px solid var(--app-border); border-radius: 10px; background: var(--app-bg); }
.analogy li > span:last-child { display: flex; flex-direction: column; gap: 0.25rem; line-height: 1.5; }
.plain-note { display: block; margin-top: 0.375rem; padding: 0.5rem 0.625rem; border-radius: 8px; background: var(--app-bg); line-height: 1.5; }
.glossary { margin-top: 1rem; }
.glossary > p { margin: 0 0 0.75rem; }
.glossary dl { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.625rem 1.25rem; line-height: 1.6; }
.glossary dt { font-weight: 650; text-align: start; }
.glossary dd { margin: 0; }
@media (max-width: 640px) { .glossary dl { grid-template-columns: 1fr; } .glossary dd { margin-bottom: 0.5rem; } }
.chain { display: flex; align-items: center; gap: 0.625rem; flex-wrap: wrap; margin-bottom: 0.75rem; }
.chain i { color: var(--app-text-muted); }
.layer {
  padding: 0.5rem 0.875rem; border-radius: 8px; border: 1px solid var(--app-border); font-weight: 550;
  background: var(--app-bg);
}
.layer.core { border-color: var(--app-accent); color: var(--app-accent); }
.layer.infra { display: flex; flex-direction: column; border-style: dashed; margin-inline-start: auto; }
.layer.infra small { font-weight: 400; color: var(--app-text-muted); }
.layers p { margin: 0; line-height: 1.6; }

.flow-picker { flex-wrap: wrap; margin-bottom: 1rem; }
.flow-head { margin-bottom: 0.75rem; }
.flow-head p { margin: 0.375rem 0 0; color: var(--app-text-muted); line-height: 1.5; }
.request { font-size: 0.8125rem; padding: 0.125rem 0.5rem; border-radius: 6px; background: var(--app-bg); border: 1px solid var(--app-border); }

.diagram-scroll { overflow-x: auto; border: 1px solid var(--app-border); border-radius: 10px; background: var(--app-bg); }
.diagram { display: block; width: 100%; min-width: 760px; height: auto; }
.lane { fill: var(--app-surface); stroke: var(--app-border); }
.lane-title { fill: var(--app-text-muted); font-size: 13px; font-weight: 600; }
.node rect { fill: var(--app-surface); stroke: var(--app-border); stroke-width: 1.5; transition: fill 0.25s, stroke 0.25s; }
.node text { fill: var(--app-text); font-size: 13px; font-weight: 550; }
.node { cursor: pointer; outline: none; }
.node:focus-visible rect, .node.pinned rect { stroke: var(--chart-series-2); stroke-width: 3; }
.node.idle { opacity: 0.35; }
.node.visited rect { stroke: var(--chart-series-1); }
.node.active rect { fill: var(--chart-series-1); stroke: var(--chart-series-1); }
.node.active text { fill: #fff; }
.edge { stroke: var(--chart-series-2); stroke-width: 2.5; stroke-dasharray: 6 5; animation: dash 0.8s linear infinite; }
.arrowhead { fill: var(--chart-series-2); }
@keyframes dash { to { stroke-dashoffset: -22; } }
@media (prefers-reduced-motion: reduce) { .edge { animation: none; } }

.hint { margin: 0.75rem 0 0.5rem; font-size: 0.8125rem; display: flex; gap: 0.5rem; align-items: center; }
.detail { border: 1px solid var(--chart-series-1); border-radius: 10px; padding: 0.875rem 1rem; background: color-mix(in srgb, var(--chart-series-1) 6%, transparent); }
.detail header, .card header { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0.5rem 0.75rem; margin-bottom: 0.5rem; }
.detail h3, .card h3 { margin: 0; font-size: 1rem; }
.detail header code, .card header code { font-size: 0.75rem; color: var(--app-text-muted); }
.detail dl, .card dl { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.375rem 1rem; line-height: 1.55; }
.detail dt, .card dt { font-weight: 600; color: var(--app-text-muted); }
.detail dd, .card dd { margin: 0; }
.path { font-size: 0.75rem; word-break: break-all; }
.hosting { margin-top: 1rem; }
.hosting > p { margin: 0 0 0.75rem; line-height: 1.6; }
.hosting h3 { margin: 1.25rem 0 0.5rem; font-size: 0.95rem; }
.hosting-steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; }
.hosting-steps li { display: flex; gap: 0.75rem; align-items: flex-start; line-height: 1.55; }
.impls { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
.impl-pair { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; width: 100%; }
.impl { display: flex; flex-direction: column; gap: 0.25rem; padding: 0.625rem 0.75rem; border: 1px solid var(--app-border); border-radius: 8px; background: var(--app-bg); line-height: 1.5; }
.impl.iface { border-color: var(--chart-series-1); padding: 0.375rem 1rem; }
.impl.demo { border-style: dashed; }
.honest { display: flex; gap: 0.5rem; align-items: flex-start; padding: 0.625rem 0.75rem; border-radius: 8px; background: color-mix(in srgb, var(--chart-series-1) 8%, transparent); line-height: 1.6; }
.docker { width: 100%; border-collapse: collapse; margin-bottom: 0.5rem; }
.docker th, .docker td { text-align: start; padding: 0.4rem 0.5rem; border-bottom: 1px solid var(--app-border); }
.docker th { color: var(--app-text-muted); font-weight: 550; font-size: 0.8125rem; }
@media (max-width: 640px) { .impl-pair { grid-template-columns: 1fr; } }
.catalog { margin-top: 1rem; }
.catalog > p { margin: 0 0 0.75rem; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(320px, 100%), 1fr)); gap: 0.75rem; }
.card { border: 1px solid var(--app-border); border-radius: 10px; padding: 0.875rem 1rem; background: var(--app-bg); }
.card dl { grid-template-columns: 1fr; gap: 0.125rem; }
.card dd { margin-bottom: 0.375rem; }
.lane-chip { font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.04em; color: var(--chart-series-1); width: 100%; }
@media (max-width: 640px) { .detail dl { grid-template-columns: 1fr; } .detail dd { margin-bottom: 0.375rem; } }
.controls { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; margin: 0.75rem 0; }
.step-count { margin-inline-start: auto; }

.steps { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.375rem; }
.steps button {
  display: flex; gap: 0.75rem; width: 100%; padding: 0.625rem 0.75rem; text-align: start; font: inherit; color: inherit;
  background: transparent; border: 1px solid transparent; border-radius: 8px; cursor: pointer;
}
.steps button:hover { background: var(--app-bg); }
.steps li.current button { border-color: var(--chart-series-1); background: color-mix(in srgb, var(--chart-series-1) 8%, transparent); }
.steps li.done { opacity: 0.75; }
.badge {
  flex-shrink: 0; width: 24px; height: 24px; border-radius: 50%; display: grid; place-items: center; font-size: 0.75rem; font-weight: 700;
  background: var(--app-border); color: var(--app-text);
}
.steps li.current .badge { background: var(--chart-series-1); color: #fff; }
.step-text { display: flex; flex-direction: column; gap: 0.125rem; line-height: 1.5; }
.code-path { font-size: 0.75rem; color: var(--app-text-muted); margin-top: 0.25rem; }
.demo-note { margin: 1rem 0 0; display: flex; gap: 0.5rem; align-items: center; line-height: 1.5; }
</style>
