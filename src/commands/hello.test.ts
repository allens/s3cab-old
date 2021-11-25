import Hello from '../../src/commands/hello'
import { stdout } from 'stdout-stderr'

describe('hello', () => {
  beforeEach(() => {
    stdout.start()
  })

  afterEach(() => {
    stdout.stop()
  })

  it('runs hello', async () => {
    await Hello.run()
    expect(stdout.output).toContain('hello world')
  })

  it('runs hello --name jeff', async () => {
    await Hello.run(['--name', 'jeff'])
    expect(stdout.output).toContain('hello jeff')
  })
})
