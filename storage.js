class Cache {
    constructor(cache = {}) {
        this.cache = cache;
    }
    set(key, val) {
        this.cache[key] = val;
    }
    get(key) {
        return this.cache[key];
    }
    remove(key) {
        delete this.cache[key];
    }
    reset() {
        this.cache = {};
    }
}

export { Cache };