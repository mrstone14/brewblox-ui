import type { RegisterOptions } from 'vuex-class-modules';
import { Action, Module, Mutation, VuexModule } from 'vuex-class-modules';

import { eventbus } from '@/plugins/eventbus';
import { deserialize } from '@/plugins/spark/parse-object';
import type {
  Block,
  BlockAddress,
  BlockFieldAddress,
  Limiters,
  Link,
  RelationEdge,
  SparkExported,
  SparkPatchEvent,
  SparkService,
  SparkStatus,
} from '@/plugins/spark/types';
import { isSparkPatch, isSparkState } from '@/plugins/spark/utils';
import { serviceStore } from '@/store/services';
import { widgetStore } from '@/store/widgets';
import { STATE_TOPIC } from '@/utils/const';
import { extendById, filterById, findById, typeMatchFilter } from '@/utils/functional';

import * as api from './api';
import {
  asServiceStatus,
  asSparkStatus,
  calculateDrivenChains,
  calculateLimiters,
  calculateRelations,
} from './utils';

@Module({ generateMutationSetters: true })
export class SparkServiceModule extends VuexModule {
  private patchListenerId = '';
  private stateListenerId = '';

  public readonly id: string; // serviceId

  public blocks: Block[] = [];
  public volatileBlocks: Block[] = [];
  public discoveredBlocks: string[] = [];
  public status: SparkStatus | null = null;
  public lastBlocks: Date | null = null;
  public lastStatus: Date | null = null;

  public constructor(serviceId: string, options: RegisterOptions) {
    super(options);
    this.id = serviceId;
  }

  public get blockIds(): string[] {
    return this.blocks.map(v => v.id);
  }

  public get drivenChains(): string[][] {
    return calculateDrivenChains(this.blocks);
  }

  public get drivenBlocks(): string[] {
    return this.drivenChains.map(c => c[0]);
  }

  public get relations(): RelationEdge[] {
    return calculateRelations(this.blocks);
  }

  public get limiters(): Limiters {
    return calculateLimiters(this.blocks);
  }

  public get service(): SparkService {
    return serviceStore.serviceById(this.id)!;
  }

  @Mutation
  public setBlock(block: Block): void {
    this.blocks = extendById(this.blocks, block);
  }

  @Mutation
  public updateBlocks(blocks: Block[]): void {
    this.blocks = blocks;
    this.lastBlocks = new Date();
  }

  @Mutation
  public patchBlocks({ changed, deleted }: SparkPatchEvent['data']): void {
    const affected = [
      ...changed.map(block => block.id),
      ...deleted,
    ];
    this.blocks = [
      ...this.blocks.filter(v => !affected.includes(v.id)),
      ...changed,
    ];
  }

  @Mutation
  public updateStatus(status: SparkStatus): void {
    this.status = status;
    this.lastStatus = new Date();
  }

  @Mutation
  public invalidateBlocks(): void {
    this.blocks = [];
    this.lastBlocks = null;
  }

  private findById<T extends Block>(blocks: Block[], id: string | null): T | null {
    return findById(blocks, id) as T | null;
  }

  private findByAddress<T extends Block>(blocks: Block[], addr: T | BlockAddress | null): T | null {
    if (!addr || !addr.id || (addr.serviceId && addr.serviceId !== this.id)) { return null; }
    return blocks.find(v => v.id === addr.id && (!v.type || v.type === addr.type)) as T ?? null;
  }

  private findByLink<T extends Block>(blocks: Block[], link: Link | null): T | null {
    if (!link || !link.id) { return null; }
    return this.findById<T>(blocks, link.id);
  }

  private findFieldByAddress(blocks: Block[], addr: BlockFieldAddress | null): any | null {
    const block = this.findByAddress(blocks, addr);
    if (!block || !addr?.field) { return null; }
    return block.data[addr.field] ?? null;
  }

  public blockById<T extends Block>(blockId: string | null): T | null {
    return this.findById<T>(this.blocks, blockId) ?? this.findById<T>(this.volatileBlocks, blockId);
  }

  public blockByAddress<T extends Block>(addr: T | BlockAddress | null): T | null {
    return this.findByAddress<T>(this.blocks, addr) ?? this.findByAddress<T>(this.volatileBlocks, addr);
  }

  public blockByLink<T extends Block>(link: Link | null): T | null {
    return this.findByLink<T>(this.blocks, link) ?? this.findByLink<T>(this.volatileBlocks, link);
  }

  public fieldByAddress(addr: BlockFieldAddress | null): any {
    return this.findFieldByAddress(this.blocks, addr) ?? this.findFieldByAddress(this.volatileBlocks, addr);
  }

  public blocksByType<T extends Block>(type: T['type']): T[] {
    return this.blocks.filter(typeMatchFilter<T>(type));
  }

  @Action
  public async fetchBlock(block: Block): Promise<void> {
    this.setBlock(await api.fetchBlock(block));
  }

  @Action
  public async createBlock(block: Block): Promise<void> {
    if (block.meta?.volatile) {
      throw new Error(`Block ${block.id} is volatile`);
    }
    await api.createBlock(block); // triggers patch event
  }

  @Action
  public async createVolatileBlock(block: Block): Promise<void> {
    if (this.blockIds.includes(block.id)) {
      throw new Error(`Block ${block.id} already exists as persistent block`);
    }
    block.meta = block.meta ?? {};
    block.meta.volatile = true;
    this.volatileBlocks = extendById(this.volatileBlocks, block);
  }

  @Action
  public async saveBlock(block: Block): Promise<void> {
    if (block.meta?.volatile) {
      this.volatileBlocks = extendById(this.volatileBlocks, block);
    }
    else {
      await api.persistBlock(block); // triggers patch event
    }
  }

  public async modifyBlock<T extends Block>(block: T, func: ((v: T) => T)): Promise<void> {
    const actual = this.blockByAddress<T>(block);
    if (actual) {
      return this.saveBlock(func(actual));
    }
  }

  @Action
  public async removeBlock(block: Block): Promise<void> {
    if (block.meta?.volatile) {
      this.volatileBlocks = filterById(this.volatileBlocks, block);
    }
    else {
      await api.deleteBlock(block); // triggers patch event
    }
  }

  @Action
  public async removeVolatileBlock(block: Block): Promise<void> {
    this.volatileBlocks = filterById(this.volatileBlocks, block);
  }

  @Action
  public async fetchBlocks(): Promise<void> {
    this.updateBlocks(await api.fetchBlocks(this.id));
  }

  @Action
  public async renameBlock([currentId, newId]: [string, string]): Promise<void> {
    if (this.blockById(newId)) {
      throw new Error(`Block ${newId} already exists`);
    }

    const volatile = this.findById(this.volatileBlocks, currentId);
    if (volatile) {
      this.volatileBlocks = [
        ...filterById(this.volatileBlocks, volatile),
        { ...volatile, id: newId },
      ];
      return;
    }

    await api.renameBlock(this.id, currentId, newId);
    await this.fetchBlocks();
    widgetStore.widgets
      .filter(({ config }) => config.serviceId === this.id && config.blockId === currentId)
      .forEach(widget => {
        widget.config.blockId = newId;
        widget.title = newId;
        widgetStore.saveWidget(widget);
      });
  }

  @Action
  public async clearBlocks(): Promise<void> {
    await api.clearBlocks(this.id);
    await this.fetchBlocks();
  }

  @Action
  public async saveAutoConnecting(enabled: boolean): Promise<void> {
    await api.persistAutoconnecting(this.id, enabled);
  }

  @Action
  public async fetchDiscoveredBlocks(): Promise<string[]> {
    const discovered = (await api.fetchDiscoveredBlocks(this.id)).map(v => v.id);
    this.discoveredBlocks = [...this.discoveredBlocks, ...discovered];
    return discovered;
  }

  @Action
  public async clearDiscoveredBlocks(): Promise<void> {
    this.discoveredBlocks = [];
  }

  @Action
  public async cleanUnusedNames(): Promise<string[]> {
    return await api.cleanUnusedNames(this.id);
  }

  @Action
  public async fetchAll(): Promise<boolean> {
    const status = await api.fetchSparkStatus(this.id);
    this.updateStatus(status);
    serviceStore.updateStatus(asServiceStatus(status));
    if (status.isSynchronized) {
      await Promise.all([
        this.fetchDiscoveredBlocks(),
        this.fetchBlocks(),
      ]);
    }
    return !!status.isSynchronized;
  }

  @Action
  public async flashFirmware(): Promise<any> {
    return await api.flashFirmware(this.id);
  }

  @Action
  public async serviceExport(): Promise<SparkExported> {
    return await api.serviceExport(this.id);
  }

  @Action
  public async serviceImport(exported: SparkExported): Promise<string[]> {
    const importLog = await api.serviceImport(this.id, exported);
    await this.fetchBlocks();
    return importLog;
  }

  @Action
  public async controllerReboot(): Promise<void> {
    await api.controllerReboot(this.id);
  }

  @Action
  public async serviceReboot(): Promise<void> {
    await api.serviceReboot(this.id);
  }

  @Action
  public async start(): Promise<void> {
    this.stateListenerId = eventbus.addListener(
      `${STATE_TOPIC}/${this.id}`,
      (_, evt) => {
        if (isSparkState(evt)) {
          const status = asSparkStatus(this.id, evt.data.status);
          const blocks = evt.data.blocks.map(deserialize);

          this.updateBlocks(blocks);
          this.updateStatus(status);
          serviceStore.updateStatus(asServiceStatus(status));
        }
      });
    this.patchListenerId = eventbus.addListener(
      `${STATE_TOPIC}/${this.id}/patch`,
      (_, evt) => {
        if (isSparkPatch(evt)) {
          const changed = evt.data.changed.map(deserialize);
          const { deleted } = evt.data;
          this.patchBlocks({ changed, deleted });
        }
      });

    await this.fetchAll().catch(() => { });
  }

  @Action
  public async stop(): Promise<void> {
    eventbus.removeListener(this.stateListenerId);
    eventbus.removeListener(this.patchListenerId);
  }
}
