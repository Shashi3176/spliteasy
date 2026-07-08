import { spawn } from 'child_process';
import path from 'path';

export type Balance = {
    userId: string;
    amount: number;
}

export type Transaction = {
    from: string,
    to: string,
    amount: number
}

export type AlgorithmResult = {
    transactions: Transaction[],
    count: number,
    timeMs: number
}

export type OptimalResult = {
    transactions: Transaction[],
    optimalCount: number,
    greedyCount: number,
    timeMs: number
}

function runBinary(binaryName: string, balances: Balance[]): Promise<{ data: any; timeMs: number }> {
    return new Promise((resolve, reject) => {
        const isWin = process.platform === "win32";
        const binaryExt = isWin ? '.exe' : '';
        const binaryPath = path.join(process.cwd(), 'lib', 'algorithms', 'cpp', `${binaryName}${binaryExt}`);
        
        const child = spawn(binaryPath);
        const start = Date.now();
        let output = '';
        let error = '';

        child.on('error', (err) => {
            error += `Spawn error: ${err.message}`;
        });

        child.stdout.on('data', (d) => (output += d.toString()));
        child.stderr.on('data', (d) => (error += d.toString()));

        child.stdin.on('error', (err) => {
            error += `Stdin pipe error: ${err.message}`;
        });

        child.stdin.write(JSON.stringify({ balances }), (err) => {
            if (!err) child.stdin.end();
        });

        child.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Binary ${binaryName} failed with exit code ${code}. Context: ${error}`));
                return;
            }

            try {
                resolve({
                    data: JSON.parse(output),
                    timeMs: Date.now() - start
                });
            } catch (parseError) {
                reject(new Error(`Binary ${binaryName} succeeded but returned invalid JSON. Error: ${parseError}. Raw output: ${output}`));
            }
        });
    });
}

export async function runGreedy(balances: Balance[]): Promise<AlgorithmResult> {
    const result = await runBinary('greedy', balances);

    const transactions = result.data as Transaction[];
    return {
        transactions: transactions,
        count: transactions.length,
        timeMs: result.timeMs
    }
}

export async function runOptimal(
  balances: Balance[]
): Promise<OptimalResult> {
  const result = await runBinary('optimal', balances);
  const { transactions, optimalCount, greedyCount } = result.data;
  return {
    transactions: transactions,
    optimalCount: optimalCount,
    greedyCount: greedyCount,
    timeMs: result.timeMs
  };
}
