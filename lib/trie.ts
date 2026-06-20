type TrieNode<T> = {
  children: Map<string, TrieNode<T>>;
  isEndOfWord: boolean;
  values: Set<T>;
};

export class Trie<T> {
  private root: TrieNode<T>;

  constructor() {
    this.root = this.createNode();
  }

  private createNode(): TrieNode<T> {
    return {
      children: new Map(),
      isEndOfWord: false,
      values: new Set(),
    };
  }

  private normalize(text: string): string {
    return text.toLowerCase();
  }

  private tokenize(text: string): string[] {
    return this.normalize(text)
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }

  insert(key: string, value: T): void {
    const tokens = this.tokenize(key);

    for (const token of tokens) {
      let node = this.root;

      for (const char of token) {
        let child = node.children.get(char);
        if (!child) {
          child = this.createNode();
          node.children.set(char, child);
        }
        child.values.add(value);
        node = child;
      }

      node.isEndOfWord = true;
    }
  }

  search(prefix: string): T[] {
    const normalizedPrefix = this.normalize(prefix).trim();

    if (!normalizedPrefix) {
      return [];
    }

    let node: TrieNode<T> | undefined = this.root;

    for (const char of normalizedPrefix) {
      node = node.children.get(char);
      if (!node) {
        return [];
      }
    }

    return Array.from(node.values);
  }

  clear(): void {
    this.root = this.createNode();
  }
}