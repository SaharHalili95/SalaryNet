import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import {
  angularComponentDetails,
  angularFlows,
  angularLanes,
  angularNodes,
} from '@shared/content/angular';
import type { DiagramNode, NodeId } from '@shared/content/architecture';
import { pick, type Localized } from '@shared/content/localized';
import { environment } from '../../../environments/environment';
import { LocaleService } from '../../core/locale.service';
import { TranslatePipe } from '../../core/translate.pipe';
import { ArchitectureIntro } from './architecture-intro';
import { ArchitectureReference } from './architecture-reference';
import { GuideHeader } from './guide-header';

/* Diagram geometry (SVG user units), the same as the Vue page. */
const LANE_WIDTH = 180;
const NODE_WIDTH = 156;
const NODE_HEIGHT = 44;
const ROW_HEIGHT = 62;
const TOP = 64;
const STEP_MS = 2200;

@Component({
  selector: 'app-architecture',
  imports: [MatButtonModule, MatIconModule, TranslatePipe, GuideHeader, ArchitectureIntro, ArchitectureReference],
  templateUrl: './architecture.html',
  styleUrl: './architecture.css',
})
export class Architecture {
  protected readonly i18n = inject(LocaleService);
  protected readonly demoMode = environment.demoMode;

  protected readonly lanes = angularLanes;
  protected readonly nodes = angularNodes;
  protected readonly flows = angularFlows;
  protected readonly width = LANE_WIDTH * angularLanes.length;
  protected readonly height = TOP + ROW_HEIGHT * 5 + 8;
  protected readonly laneWidth = LANE_WIDTH;
  protected readonly nodeWidth = NODE_WIDTH;
  protected readonly nodeHeight = NODE_HEIGHT;

  protected readonly rtl = computed(() => this.i18n.locale() === 'he');
  private readonly byId = new Map(angularNodes.map((n) => [n.id, n]));

  protected readonly flowId = signal(angularFlows[0]!.id);
  protected readonly flow = computed(() => angularFlows.find((f) => f.id === this.flowId())!);
  protected readonly stepIndex = signal(0);
  protected readonly step = computed(() => this.flow().steps[this.stepIndex()]!);
  protected readonly activeNode = computed(() => this.byId.get(this.step().node)!);
  protected readonly visited = computed(
    () => new Set<NodeId>(this.flow().steps.slice(0, this.stepIndex() + 1).map((s) => s.node)),
  );
  protected readonly involved = computed(() => new Set<NodeId>(this.flow().steps.map((s) => s.node)));

  /** A box the reader clicked; otherwise the card follows the step being played. */
  protected readonly pinned = signal<NodeId | null>(null);
  protected readonly detailNode = computed(() => this.byId.get(this.pinned() ?? this.activeNode().id)!);
  protected readonly detail = computed(() => angularComponentDetails[this.detailNode().id]);

  /** The edge into the current step, drawn from the previous step's node. */
  protected readonly arrow = computed(() => {
    const index = this.stepIndex();
    if (index === 0) return null;
    const from = this.byId.get(this.flow().steps[index - 1]!.node)!;
    const to = this.activeNode();
    if (from.id === to.id) return null;
    const a = this.box(from);
    const b = this.box(to);
    const ax = a.x + NODE_WIDTH / 2;
    const ay = a.y + NODE_HEIGHT / 2;
    const bx = b.x + NODE_WIDTH / 2;
    const by = b.y + NODE_HEIGHT / 2;
    // Start and end on the box edges facing each other so the arrowhead stays visible.
    const dx = bx - ax;
    const dy = by - ay;
    const edge = (cx: number, cy: number, sx: number, sy: number) => {
      const scale = Math.min(Math.abs(NODE_WIDTH / 2 / (sx || 1e-9)), Math.abs(NODE_HEIGHT / 2 / (sy || 1e-9)));
      return { x: cx + sx * scale, y: cy + sy * scale };
    };
    const start = edge(ax, ay, dx, dy);
    const end = edge(bx, by, -dx, -dy);
    return { x1: start.x, y1: start.y, x2: end.x, y2: end.y };
  });

  protected readonly playing = signal(false);
  private timer: ReturnType<typeof setInterval> | undefined;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  protected text(value: Localized): string {
    return pick(value, this.i18n.locale());
  }

  protected node(id: NodeId): DiagramNode {
    return this.byId.get(id)!;
  }

  protected laneX(lane: number): number {
    return (this.rtl() ? angularLanes.length - 1 - lane : lane) * LANE_WIDTH;
  }

  protected box(node: DiagramNode): { x: number; y: number } {
    return { x: this.laneX(node.lane) + (LANE_WIDTH - NODE_WIDTH) / 2, y: TOP + node.row * ROW_HEIGHT };
  }

  protected chooseFlow(id: string): void {
    this.stop();
    this.pinned.set(null);
    this.flowId.set(id);
    this.stepIndex.set(0);
  }

  protected pin(id: NodeId): void {
    this.stop();
    this.pinned.set(this.pinned() === id ? null : id);
  }

  protected go(delta: number): void {
    this.stop();
    this.pinned.set(null);
    this.stepIndex.set(Math.min(Math.max(this.stepIndex() + delta, 0), this.flow().steps.length - 1));
  }

  protected select(index: number): void {
    this.stop();
    this.pinned.set(null);
    this.stepIndex.set(index);
  }

  protected togglePlay(): void {
    if (this.playing()) {
      this.stop();
      return;
    }
    if (this.stepIndex() === this.flow().steps.length - 1) this.stepIndex.set(0);
    this.playing.set(true);
    this.timer = setInterval(() => {
      if (this.stepIndex() < this.flow().steps.length - 1) this.stepIndex.update((i) => i + 1);
      else this.stop();
    }, STEP_MS);
  }

  private stop(): void {
    this.playing.set(false);
    clearInterval(this.timer);
  }
}
