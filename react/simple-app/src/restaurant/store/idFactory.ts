const SEP = '-';

class IdFactory {
  private static _instance: IdFactory | null = null;
  private counters: Record<string, number> = {};

  private constructor() {}

  static getInstance(): IdFactory {
    if (!this._instance) this._instance = new IdFactory();
    return this._instance;
  }

  // 添加新 type 或设置起始值（下次 get 将返回 start+1）
  addType(type: string, start = 0): void {
    if (!type) throw new Error('type required');
    if (!(type in this.counters)) {
      this.counters[type] = start;
    }
  }

  // 获取该 type 的新 id（自动添加 type 如果尚未存在）
  getNewIdByType(type: string): string {
    if (!type) throw new Error('type required');
    if (!(type in this.counters)) this.addType(type, 0);
    this.counters[type] += 1;
    return `${type}${SEP}${this.counters[type]}`;
  }

  // 可选：查看当前计数（不改变状态）
  peek(type: string): number {
    return this.counters[type] ?? 0;
  }

  // 可选：重置某个 type 或全部（用于测试）
  reset(type?: string): void {
    if (type) delete this.counters[type];
    else this.counters = {};
  }
}

const idFactory = IdFactory.getInstance();
export default idFactory;
