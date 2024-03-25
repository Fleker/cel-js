import { Injectable } from '@angular/core';
import { CelSpec, TextFormatter } from '@fleker/cel-js';
import { Subject } from 'rxjs';
import { Pokemon } from './pokemon';

type Entry = Pokemon
type Entries = Entry[]
interface Task {
  fn: (() => Promise<void>)
  runId: number
}

interface SubscriberTask {
  fn: (() => Promise<Entry | undefined>)
  runId: number
}

interface CelEvent {
  pokemon?: Entry
  pct: number
}

declare let window: {
  scheduler: {
    // eslint-disable-next-line @typescript-eslint/ban-types
    yield: Function
  },
  // eslint-disable-next-line @typescript-eslint/ban-types
  requestAnimationFrame: Function,
}

@Injectable({
  providedIn: 'root'
})
export class CelServiceService {
  customTags: string[] = []
  schedulerYield = false
  runId = -1

  // Code listed below is part of Chrome's effort to improve the UI thread
  // While JS is still not multi-threaded, breaking up steps can help improve
  // performance for operations like catching and hatching.
  // See https://web.dev/optimize-long-tasks/ for future APIs.
  private yieldToMain() {
    if (this.schedulerYield && 'scheduler' in window && 'yield' in window.scheduler) {
      console.debug('using scheduler yield to perform a yield operation')
      return window.scheduler.yield()
    }
    return new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filterEntry(entry: Entry, ast: any, celSpec: CelSpec): boolean {
    const bindings = {
      species: `"${entry.species}"`,
      dex: `${entry.dex}`,
      types: entry.type2 ?
        `["${entry.type1}", "${entry.type2}"]` :
        `["${entry.type1}"]`,
      // FIXME Hack for Unown
      form: entry.form ? 
        `'${entry.form?.replace(/[?]/, 'Question').replace(/[!]/, 'Exclamation')}'`
        : `''`,
    }

    const bindingsAst = (() => {
      if (!bindings) return {}
      const tf = new TextFormatter({}, bindings)
      const res: Record<string, any> = {
        form: {
          string_value: ''
        }, // Just as default
      }
      for (const [key, entry] of Object.entries(bindings)) {
        const entryAst = celSpec.toAST(`${entry}`)
        try {
          const entryCel = tf.format(entryAst)
          res[key] = entryCel
        } catch (e) {
          console.error(`Cannot CEL bind ${key} as ${entry}: ${e}`, res, entryAst, ast)
        }
      }
      return res
    })()
    const tf = new TextFormatter({}, bindingsAst)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cel = tf.format(ast) as any
    if (cel.bool_value) {
      return true
    }
    return false
  }

  async run(inputEntries: Entries, expr: string) {
    if (!expr || !expr.length) expr = 'true'
    this.runId = Date.now()
    const celSpec = new CelSpec()
    const ast = celSpec.toAST(expr, {});
    const tasks: Task[] = []
    const filteredEntries: Entry[] = []
    
    inputEntries.forEach(entry => {
      tasks.push({
        runId: this.runId,
        fn: async () => {
          if (this.filterEntry(entry, ast, celSpec)) {
            filteredEntries.push(entry)
          }
        }
      })
    })
    while (tasks.length > 0) {
      const task = tasks.shift()!
      if (task.runId === this.runId) {
        await task.fn()
        if (tasks.length % 100 === 0) {
          await this.yieldToMain()
        }
      }
    }
    console.debug('CEL done')
    return filteredEntries
  }

  async runAndSubscribe(inputEntries: Entries, expr: string) {
    if (!expr || !expr.length) expr = 'true'
    this.runId = Date.now()
    const celSpec = new CelSpec()
    const ast = celSpec.toAST(expr, {});
    return this.schedulerYield ? this.execWithScheduler(ast, celSpec, inputEntries)
        : this.execWithTasks(ast, celSpec, inputEntries)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execWithTasks(ast: any, celSpec: CelSpec, inputEntries: Entries) {
    const tasks: SubscriberTask[] = []
    
    inputEntries.forEach(entry => {
      tasks.push({
        runId: this.runId,
        fn: async () => {
          if (this.filterEntry(entry, ast, celSpec)) {
            return entry
          }
          return undefined
        }
      })
    })

    const subscriber = new Subject<CelEvent>()
    const taskTotal = tasks.length
    window.requestAnimationFrame(async () => {
      while (tasks.length > 0) {
        const task = tasks.shift()!
        if (task.runId === this.runId) {
          const entry = await task.fn()
          if (entry) {
            const pct = (taskTotal - tasks.length) / taskTotal * 100
            subscriber.next({
              pokemon: entry,
              pct,
            })
            // console.debug('CEL at', pct)
          } else if (tasks.length % 100 === 0) {
            const pct = (taskTotal - tasks.length) / taskTotal * 100
            subscriber.next({
              pokemon: undefined,
              pct,
            })
            await this.yieldToMain()
            // console.debug('CEL at', pct)
          }
        }
      }
      subscriber.next({
        pokemon: undefined,
        pct: 0,
      })
      // console.debug('CEL done')
    })
    return subscriber
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async execWithScheduler(ast: any, celSpec: CelSpec, inputEntries: Entries) {
    const subscriber = new Subject<CelEvent>()
    let taskId = 0
    const taskTotal = inputEntries.length
    const runId = this.runId

    window.requestAnimationFrame(async () => {
      for (const entry of inputEntries) {
        if (runId === this.runId) {
          const match = this.filterEntry(entry, ast, celSpec)
          if (match) {
            const pct = taskId / taskTotal * 100
            subscriber.next({
              pokemon: entry,
              pct,
            })
            // console.debug('Scheduler Match', pct, entry)
            // await this.yieldToMain()
          }
          if (++taskId % 100 === 0) {
            const pct = taskId / taskTotal * 100
            subscriber.next({
              pokemon: undefined,
              pct,
            })
            console.debug('Scheduler Modul', pct)
            await this.yieldToMain()
          }
        }
      }

      subscriber.next({
        pokemon: undefined,
        pct: 0,
      })
    })
    return subscriber
  }

  stop() {
    this.runId = Date.now() // Forces existing tasks to no-op
  }
}
