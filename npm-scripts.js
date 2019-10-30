const process = require('process');
const os = require('os');
const { execSync } = require('child_process');
const fs = require('fs');
const TscWatchClient = require('tsc-watch/client');
const { version } = require('./package.json');

const isWindows = os.platform() === 'win32';
const task = process.argv.slice(2).join(' ');

// Just for Windows.
let PYTHON;
let GULP;
let MSBUILD;
let MEDIASOUP_BUILDTYPE;
let MEDIASOUP_TEST_TAGS;

if (isWindows)
{
	PYTHON = process.env.PYTHON || 'python';
	GULP = process.env.GULP || 'gulp';
	MSBUILD = process.env.MSBUILD || 'MSBuild';
	MEDIASOUP_BUILDTYPE = process.env.MEDIASOUP_BUILDTYPE || 'Release';
	MEDIASOUP_TEST_TAGS = process.env.MEDIASOUP_TEST_TAGS || '';
}

// eslint-disable-next-line no-console
console.log(`npm-scripts.js [INFO] running task "${task}"`);

switch (task)
{
	case 'typescript:build':
	{
		if (!isWindows)
			execute('rm -rf build && tsc');
		else
			execute('rmdir /s build && tsc');

		taskReplaceVersion();

		break;
	}

	case 'typescript:watch':
	{
		if (!isWindows)
			execute('rm -rf build');
		else
			execute('rmdir /s build');

		const watch = new TscWatchClient();

		watch.on('success', taskReplaceVersion);
		watch.start('--pretty');

		break;
	}

	case 'lint:node':
	{
		if (!isWindows)
		{
			execute('MEDIASOUP_NODE_LANGUAGE=typescript eslint -c .eslintrc.js --ext=ts lib/');
			execute('MEDIASOUP_NODE_LANGUAGE=javascript eslint -c .eslintrc.js --ext=js --ignore-pattern \'!.eslintrc.js\' .eslintrc.js gulpfile.js npm-scripts.js test/');
		}
		else
		{
			notSupportedTask();
		}

		break;
	}

	case 'lint:worker':
	{
		if (!isWindows)
			execute('make lint -C worker');
		else
			execute(`${GULP} lint:worker`);

		break;
	}

	case 'format:worker':
	{
		if (!isWindows)
			execute('make format -C worker');
		else
			execute(`${GULP} format:worker`);

		break;
	}

	case 'test:node':
	{
		taskReplaceVersion();
		execute('jest');

		break;
	}

	case 'test:worker':
	{
		if (!isWindows)
		{
			execute('make test -C worker');
		}
		else if (!process.env.MEDIASOUP_WORKER_BIN)
		{
			execute(`${PYTHON} ./worker/scripts/configure.py --format=msvs -R mediasoup-worker-test`);
			execute(`${MSBUILD} ./worker/mediasoup-worker.sln /p:Configuration=${MEDIASOUP_BUILDTYPE}`);
			execute(`cd worker && .\\out\\${MEDIASOUP_BUILDTYPE}\\mediasoup-worker-test.exe --invisibles --use-colour=yes ${MEDIASOUP_TEST_TAGS}`);
		}

		break;
	}

	case 'coverage':
	{
		taskReplaceVersion();
		execute('jest --coverage');
		execute('open-cli coverage/lcov-report/index.html');

		break;
	}

	case 'postinstall':
	{
		if (!isWindows)
		{
			execute('make -C worker');
		}
		else if (!process.env.MEDIASOUP_WORKER_BIN)
		{
			execute(`${PYTHON} ./worker/scripts/configure.py --format=msvs -R mediasoup-worker`);
			execute(`${MSBUILD} ./worker/mediasoup-worker.sln /p:Configuration=${MEDIASOUP_BUILDTYPE}`);
		}

		break;
	}

	default:
	{
		throw new TypeError(`unknown task "${task}"`);
	}
}

function taskReplaceVersion()
{
	const files = [ 'build/index.js', 'build/Worker.js' ];

	for (const file of files)
	{
		const text = fs.readFileSync(file, { encoding: 'utf8' });
		const result = text.replace(/__MEDIASOUP_VERSION__/g, version);

		fs.writeFileSync(file, result, { encoding: 'utf8' });
	}
}

function execute(command)
{
	// eslint-disable-next-line no-console
	console.log(`npm-scripts.js [INFO] executing command: ${command}`);

	try
	{
		execSync(command,	{ stdio: [ 'ignore', process.stdout, process.stderr ] });
	}
	catch (error)
	{
		process.exit(1);
	}
}

function notSupportedTask()
{
	// eslint-disable-next-line no-console
	console.error(`npm-scripts.js [ERROR] task "${task}" not supported`);

	process.exit(2);
}
