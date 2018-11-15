import Component from 'vue-class-component';
import { Watch } from 'vue-property-decorator';
import FormBase from '@/components/Widget/FormBase';
import { Block } from '@/plugins/spark/state';
import { toShadow, fromShadow, ShadowMapping, deepCopy } from '@/helpers/shadow-copy';
import { uniqueFilter } from '@/helpers/functional';
import { profileNames, compatibleBlocks } from '@/plugins/spark/store/getters';
import { fetchCompatibleBlocks, saveBlock } from '@/plugins/spark/store/actions';
import { Link } from '@/helpers/units';

@Component
export default class BlockForm extends FormBase {
  vals: { [key: string]: any; } = {};

  get inputMapping(): ShadowMapping {
    return {};
  }

  get inputValues(): { [key: string]: any; } {
    return this.vals;
  }

  set inputValues(values: { [key: string]: any; }) {
    this.vals = values;
  }

  get block(): Block {
    return this.$props.value as Block;
  }

  get profileNames(): string[] {
    return profileNames(this.$store, this.block.serviceId);
  }

  get compatibleBlocks() {
    return compatibleBlocks(this.$store, this.block.serviceId);
  }

  get changed(): boolean {
    const state = toShadow(this.block, this.inputMapping);
    return Object.keys(state)
      .some(key => state[key] !== this.inputValues[key]);
  }

  callAndSaveBlock(func: Function) {
    return (v: any) => {
      func(v);
      this.saveBlock(this.block);
    };
  }

  reset() {
    this.inputValues = deepCopy(toShadow(this.block, this.inputMapping));
  }

  // subclasses can override this as a lifecycle hook
  afterBlockFetch() { }

  @Watch('block', { immediate: true, deep: true })
  onBlockUpdate() {
    this.afterBlockFetch();
  }

  saveBlock(block: Block = this.block) {
    saveBlock(this.$store, this.block.serviceId, block);
  }

  // TODO: remove everything below when obsolete after refactor

  cancelChanges() {
    this.reset();
  }

  confirmChanges() {
    this.$emit('input', fromShadow(this.inputValues, this.inputMapping, this.block) as Block);
  }

  fetchCompatibleBlocks(type: string) {
    fetchCompatibleBlocks(this.$store, this.block.serviceId, type);
  }

  fetchCompatibleToInputLinks() {
    Object.values(this.inputValues)
      .reduce((acc: string[], val: any) => ((val instanceof Link) ? [...acc, val.type] : acc), [])
      .filter(uniqueFilter)
      .forEach(this.fetchCompatibleBlocks);
  }

  linkOpts(link: Link) {
    return (this.compatibleBlocks[link.type || ''] || [])
      .map(id => ({
        label: id,
        value: id,
      }));
  }
}
