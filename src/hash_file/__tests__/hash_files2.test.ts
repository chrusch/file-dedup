import {hashAllCandidateFilesWithShasumCommand} from '../hash_files';
import {aPath} from '../../common/path';

jest.setTimeout(10000);
describe('hashAllCandidateFilesWithShasumCommand()', () => {
  it('does what is expected', async () => {
    const cmd = '/usr/bin/shasum';
    const stream = hashAllCandidateFilesWithShasumCommand(aPath(cmd), 8);
    let count = 0;
    stream.on('data', got => {
      count += 1;
      // const expected = [
      //   '/tmp/foo',
      //   'd69f48be310685305d26044b9bdcd0df6850ed45d49d3bacf4fb09f88dac8761',
      // ];
      expect(got[0].length).toBeGreaterThan(5);
    });
    const numWrites = 1000;
    for (let i = 1; i <= numWrites; i++) {
      setImmediate(() => stream.write(`./xx/file${i}.txt`));
    }
    setImmediate(() => stream.end());
    const resolvedCount = await new Promise(resolve => {
      stream.on('end', () => {
        // console.log('stream end', count);
        resolve(count);
      });
    });
    expect(resolvedCount).toEqual(numWrites);
    expect(count).toEqual(numWrites);
  });
});
