import React, { useState, useEffect } from 'react';
import FolderOpenIcon from "@material-ui/icons/FolderOpen";
import FolderIcon from "@material-ui/icons/Folder";
import SettingsIcon from "@material-ui/icons/Settings";
import DescriptionIcon from "@material-ui/icons/Description";
import InsertDriveFileIcon from "@material-ui/icons/InsertDriveFile";
import AddIcon from "@material-ui/icons/Add";
import ClearIcon from '@material-ui/icons/Clear';
import Typography from '@material-ui/core/Typography';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import clsx from 'clsx';
import MuiAccordion from '@material-ui/core/Accordion';
import AccordionSummary from '@material-ui/core/AccordionSummary';
import AccordionDetails from '@material-ui/core/AccordionDetails';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import BuildIcon from '@material-ui/icons/Build';
import Button from '@material-ui/core/Button';
import ButtonBase from '@material-ui/core/ButtonBase';
import TextField from '@material-ui/core/TextField';
import Fab from '@material-ui/core/Fab';
import axios from 'axios';
import zipObject from 'lodash/zipObject';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';
import CircularProgress from '@material-ui/core/CircularProgress';
import { useDropzone } from 'react-dropzone';
import { useInfoStyles } from './utils';

import Prism from 'prismjs';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-powershell';
import "prismjs/themes/prism-okaidia.css";
import 'prismjs/plugins/normalize-whitespace/prism-normalize-whitespace';

export const pageWidth = 900;
export const headerHeight = 31;

export const useStyles = makeStyles(theme => ({
    container: {
        margin: 20
    },
    icon: {
        fontSize: 18,
        marginRight: 6
    },
    actionsIcon: {
        fontSize: 18,
    },
    actionsIconSmall: {
        fontSize: 16,
    },
    node: {
        display: "flex",
        alignContent: "center",
        alignItems: "center",
        whiteSpace: "nowrap"
    },
    fileTreeRoot: {
        display: "flex",
        height: "100%",
        backgroundColor: "transparent",
        boxShadow: "none",
        '& > :first-child': {
            width: "100%"
        }
    },
    red: {
        color: theme.palette.error.main
    },
    borderOverwriter: {
        position: "absolute",
        zIndex: 100,
        background: "#fafafa",
        height: headerHeight - 1, // one border
        right: -2,
        top: 0,
        width: 3
    },
    testingTextRoot: {
        width: "100%",
        borderRadius: 3,
        backgroundColor: "rgba(0, 0, 0, 0.04)",
        display: "flex",
        padding: 10,
        border: '1px solid #ddd',
        minHeight: 60,
    },
    dragAndDropRoot: {
        textAlign: 'center',
        height: 100,
        border: '2px dashed #ddd',
        backgroundColor: 'transparent',
        color: '#aaa',
        borderRadius: 6,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 4,
        width: "100%",
        overflow: "hidden",
    },
    dragAndDropAbsolute: {
        position: "absolute",
        left: 0,
        right: 0,
        margin: "auto",
        bottom: 20,
        width: "90% !important",
        maxWidth: 280
    },
    dragAndDropRootActive: {
        border: '2px dashed #333',
        color: '#333',
    },
    dragAndDropRootReject: {
        border: `2px dashed ${theme.palette.error.main}`,
        color: theme.palette.error.main,
    },
    toggleButtonRoot: {
        width: 120,
        color: 'rgba(0, 0, 0, 0.55)'
    },
    codeRoot: {
        backgroundColor: '#272822',
        padding: 15,
        width: '100%',
        borderRadius: '0.3em',
    },
}));

export interface IDrawerLeftFunctionsContext {
    selectedFunctionName: string;
    setSelectedFunctionName: React.Dispatch<React.SetStateAction<string>>;
    setAllFunctionNames: React.Dispatch<React.SetStateAction<string[]>>
}

export interface IFunctionOptions {
    dbName: string;
    passHash: null | string;
    route: string;
}

export interface IFunctionFile {
    data?: string;
    date?: Date;
    language?: string;
    isDirectory: boolean;
    path: string;
}

export class Node {
    isDirectory: boolean = false;
    name: string = '';
    children?: Node[];
    path: string;
};

function filesToTreeNodes(arr: Record<string, IFunctionFile>): Node[] {
    var tree = {}
    function addnode(obj: IFunctionFile) {
        var splitpath = obj.path.replace(/^\/|\/$/g, "").split('/');
        var ptr = tree;
        for (let i = 0; i < splitpath.length; i++) {
            let node: Node = {
                name: splitpath[i],
                isDirectory: true,
                path: splitpath.slice(0, i + 1).join("/")
            };
            if (i == splitpath.length - 1 && !obj.isDirectory) {
                node.isDirectory = false
            }
            ptr[splitpath[i]] = ptr[splitpath[i]] || node;
            ptr[splitpath[i]].children = ptr[splitpath[i]].children || {};
            ptr = ptr[splitpath[i]].children;
        }
    }
    function objectToArr(node: any) {
        Object.keys(node || {}).map((k) => {
            if (node[k].children) {
                objectToArr(node[k])
            }
        })
        if (node.children) {
            node.children = Object.values(node.children)
            node.children.forEach(objectToArr)
        }
    }
    Object.values(arr).map(addnode);
    objectToArr(tree)
    return Object.values(tree)
}

export function treeifyPaths(files: Record<string, IFunctionFile>, selectedFunctionName: string): Node {
    try {
        const res: Node = {
            name: selectedFunctionName,
            isDirectory: true,
            children: filesToTreeNodes(files),
            path: "/"
        }
        return res;
    } catch (error) {
        return {} as any;
    }

}

export function renderLabel(data: any, unfoldStatus: boolean, classes: Record<string, any>): string | React.ReactElement<any, string | ((props: any) => React.ReactElement<any, string | (new (props: any) => React.Component<any, any, any>)> | null) | (new (props: any) => React.Component<any>)> {
    const { name, isDirectory }: Node = data;

    let iconComp = null;
    if (isDirectory) {
        iconComp = unfoldStatus ? <FolderOpenIcon /> : <FolderIcon />;
    } else {
        if (name.startsWith(".") || name.includes("config")) {
            iconComp = <SettingsIcon />;
        } else if (name.endsWith(".js")) {
            iconComp = <DescriptionIcon />;
        } else {
            iconComp = <InsertDriveFileIcon />;
        }
    }
    return (
        <Typography variant="caption" className={classes.node}>
            {React.cloneElement(iconComp, { className: classes.icon })}
            {name}
        </Typography>
    );
}

export function getActionsData(data: any, _: number[], unfoldStatus: boolean, classes: Record<string, string>, insertFileCallback: (_: string) => void, deleteFileCallback: (_: string) => void, selectedFileName: string) {
    const { isDirectory, path }: Node = data;
    if (isDirectory) {
        if (!unfoldStatus) {
            if (path !== "/") {
                return {
                    icon: <ClearIcon className={clsx(classes.actionsIconSmall, classes.red)} />,
                    onClick: () => deleteFileCallback(path + "/")
                }
            } else return null;
        }
        return {
            icon: <AddIcon className={classes.actionsIcon} />,
            label: <Typography style={{ fontSize: 11, lineHeight: 1 }}>new</Typography>,
            onClick: () => insertFileCallback(path)
        };
    } else if (selectedFileName === path) {
        return {
            icon: <ClearIcon className={clsx(classes.actionsIconSmall, classes.red)} />,
            onClick: () => deleteFileCallback(path)
        }
    }
}

export function requestChildrenData(data: any, _: number[], toggleFoldStatus: () => void, changeFileCallback: (path: string) => void) {
    const { isDirectory, path }: Node = data;
    if (isDirectory) {
        toggleFoldStatus();
    } else {
        changeFileCallback(path);
    }
}

const Accordion = withStyles({
    root: {
        border: '1px solid #ddd',
        borderLeft: "none",
        borderRight: "none",
        boxShadow: 'none',
        '&:not(:last-child)': {
            borderBottom: '1px solid #ddd !important',
        },
        '&:before': {
            display: 'none',
        },
        '&$expanded': {
            margin: 'auto',
        },
    },
    expanded: {},
})(MuiAccordion);

function PostBodyEditor({ postBody, setPostBody }: { postBody: Record<string, string>, setPostBody: React.Dispatch<React.SetStateAction<Record<string, string>>> }) {
    const classes: any = useInfoStyles();
    const rootClasses: any = useStyles();
    const [attrKeys, setAttrKeys] = useState<string[]>([]);
    const [attrValues, setAttrValues] = useState<string[]>([]);

    const setNewKey = (index: number, newVal: string) => {
        attrKeys[index] = newVal;
        setAttrKeys([...attrKeys]);
    }

    const setNewValue = (index: number, newVal: string) => {
        attrValues[index] = newVal;
        setAttrValues([...attrValues]);
    }

    useEffect(() => {
        const newObject = zipObject(attrKeys, attrValues);
        delete newObject[""];
        setPostBody(newObject);
    }, [attrValues, attrKeys]);

    return (
        <div className={clsx("flex-column", "align-items-center", attrKeys.length > 0 && "py-4", rootClasses.testingTextRoot)}>
            {attrKeys.map((curr_key, index) =>
                <div className="d-flex mb-4" key={"" + index}>
                    <span style={{ width: 50 }}></span>
                    <TextField
                        value={curr_key}
                        onChange={e => setNewKey(index, e.target.value)}
                        placeholder="Key"
                        className="mx-2"
                    />
                    <TextField
                        value={attrValues[index]}
                        onChange={e => setNewValue(index, e.target.value)}
                        placeholder="Value"
                        className="ml-2"
                    />
                    <span className="d-flex align-items-end justify-content-end" style={{ width: 50 }}>
                        <ButtonBase
                            onClick={_ => {
                                setAttrKeys(prev => {
                                    prev.splice(index, 1);
                                    return [...prev]
                                });
                                setAttrValues(prev => {
                                    prev.splice(index, 1);
                                    return [...prev]
                                })
                            }}
                            className={`${classes.clearButtonRoot} align-items-center`}
                        >
                            <ClearIcon fontSize={'small'} style={{ color: "inherit" }} />
                        </ButtonBase>
                    </span>
                </div>
            )}
            <div className="d-flex justify-content-center pt-2">
                <Button
                    variant="outlined"
                    color="secondary"
                    size="small"
                    className="mr-2"
                    onClick={e => {
                        setAttrKeys(prev => {
                            prev.push("");
                            return [...prev]
                        });
                        setAttrValues(prev => {
                            prev.push("");
                            return [...prev]
                        })
                    }}
                >
                    Add Row
</Button>
            </div>

        </div>
    )
}

export const TestingAccordion = ({ route }: { route: string }) => {
    const classes = useStyles();
    const [output, setOutput] = useState<string>("");
    const [postBody, setPostBody] = useState<Record<string, string>>({});
    const [toggleViewValue, setToggleViewValue] = useState<number>(1);
    const [wrapOutput, setWrapOutput] = useState<boolean>(false);
    const [waitingForResponse, setWaitingForResponse] = useState<boolean>(false);

    const handleGoClick = async () => {
        setWaitingForResponse(true)
        const funcResponse = await axios.post(`https://api.easybase.io/testFunction`, postBody);
        setWaitingForResponse(false);
        setOutput(typeof funcResponse.data === "object" ? JSON.stringify(funcResponse.data) : funcResponse.data);
    }

    useEffect(() => {
        if (toggleViewValue === 2) {
            Prism.plugins.NormalizeWhitespace.setDefaults({
                'remove-trailing': true,
                'remove-indent': true,
                'left-trim': true,
                'right-trim': true,
            });
            Prism.highlightAll();
        }
    }, [toggleViewValue]);

    return (
        <Accordion square TransitionProps={{ mountOnEnter: true }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" className="d-flex align-items-center"><BuildIcon className="mr-1 pr-1" />Deploy</Typography>
            </AccordionSummary>
            <AccordionDetails className="d-flex align-items-center flex-column mx-5 mb-4">
                <div className="align-items-center d-flex mb-3">
                    <ToggleButtonGroup value={toggleViewValue} exclusive onChange={(_, val) => setToggleViewValue(val)} size="small">
                        <ToggleButton value={1} classes={{ root: classes.toggleButtonRoot }}>
                            <Typography variant="button" style={{ lineHeight: 1.45 }}>Testing</Typography>
                        </ToggleButton>
                        <ToggleButton value={2} classes={{ root: classes.toggleButtonRoot }}>
                            <Typography variant="button" style={{ lineHeight: 1.45 }}>Deploy</Typography>
                        </ToggleButton>
                    </ToggleButtonGroup>
                </div>

                {toggleViewValue === 1 &&
                    <>
                        <Typography variant="h6" className="w-100 mb-1">Input:</Typography>
                        <PostBodyEditor postBody={postBody} setPostBody={setPostBody} />
                        <Typography variant="h6" className="w-100 mt-5 mb-1">Output:</Typography>
                        <pre className={clsx(classes.testingTextRoot, "mb-0")} style={wrapOutput ? { whiteSpace: "normal" } : {}}>
                            {waitingForResponse ? 
                                <div className="d-flex w-100 justify-content-center align-items-center">
                                    <CircularProgress color="secondary" size={30} />
                                </div>
                            :
                                <code>{output}</code>
                            }
                        </pre>
                        <FormControlLabel
                            className="w-100 justify-content-end"
                            control={
                                <Checkbox
                                    checked={wrapOutput}
                                    onChange={(_, val) => setWrapOutput(val)}
                                    color="secondary"
                                    size="small"
                                />
                            }
                            label={<Typography variant="body2" style={{ color: "rgba(0, 0, 0, 0.55)" }}>Wrap output</Typography>}
                        />
                        <div className="d-flex justify-content-end align-items-center w-100 mt-5">
                            <Button variant="contained" onClick={handleGoClick} style={{ backgroundColor: '#00C851', color: 'white' }}>
                                Go
                            </Button>
                        </div>
                    </>
                }

                {toggleViewValue === 2 &&
                    <>
                        <Typography variant="h6" className="w-100 mt-2">React &amp; React Native · <a target="_blank" rel="noreferrer" href="https://easybase.io/react/#cloud-functions">Read more</a></Typography>
                        <pre className={classes.codeRoot}>
                            <code className="language-jsx">{`
                                import { useEasybase, callFunction } from 'easybase-react';

                                export default function() {
                                    async function handleButtonClick() {
                                        const response = await callFunction('${route.slice(1)}', {
                                            hello: "world",
                                            message: "Find me in event.body"
                                        });

                                        console.log("Cloud function: " + response);
                                    }

                                    //...
                                }
                            `}</code>
                        </pre>

                        <Typography variant="h6" className="w-100 mt-4">Request (curl) · <a target="_blank" rel="noreferrer" href={`https://hoppscotch.io/?method=POST&url=https://api.easybase.io&path=/function${route}&contentType=application/json&bodyParams=%5B%7B"key":"hello","value":"world","active":true%7D%5D`}>Try the live API builder</a></Typography>
                        <pre className={classes.codeRoot}>
                            <code className="language-powershell">{`curl -X POST -H 'Content-Type: application/json' -d '{"hello":"world"}' 'https://api.easybase.io/function${route}'`}</code>
                        </pre>
                    </>
                }


            </AccordionDetails>
        </Accordion>
    )
}

export function getLanguageFromName(fileName: string): string {
    switch (fileName.split(".").pop()?.toLowerCase()) {
        case "json":
            return "json";
        case "ts":
        case "js":
        case "mjs":
            return "typescript";
        case "css":
            return "css";
        case "md":
        case "markdown":
            return "markdown";
        case "xml":
            return "xml";
        default:
            return "";
    }
}

export const getDefaultFilePath = (input: Record<string, IFunctionFile>): string => Object.keys(input!).filter(ele => !input![ele].isDirectory).sort((a, b) => a.length - b.length).find(ele => ele.endsWith(".js") || ele.endsWith(".ts")) || "";

// https://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers
function ab2str(buf: ArrayBuffer) {
    return String.fromCharCode.apply(null, new Uint16Array(buf) as any);
}

export function DragAndDropSingleFile({ uploadFileCallback }: { uploadFileCallback: (fileName: string, data: string) => void }): React.ReactElement {
    const classes = useStyles();

    const handleFileDrop = (filesArray: File[]) => {
        const file_reader = new FileReader();

        file_reader.onload = (e) => {
            uploadFileCallback(filesArray[0].name, typeof e.target?.result === "string" ? e.target?.result : ab2str(e.target!.result as ArrayBuffer))
        }

        filesArray.length && file_reader.readAsText(filesArray[0]);
    };

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({ onDrop: handleFileDrop, multiple: false, maxSize: 3e9 /** 3 GBs */ });

    return (
        <div className="d-flex justify-content-center w-100 mb-3">
            <div {...getRootProps()} className={clsx(classes.dragAndDropRoot, isDragActive && classes.dragAndDropRootActive, (isDragActive && isDragReject) && classes.dragAndDropRootReject)}>
                <input {...getInputProps()} />
                <Typography variant="body2" className="m-0">Drop a file here</Typography>
            </div>
        </div>
    )
}

export const DefaultFunctionPlaceholder = () => {
    return (
        <div className="d-flex justify-content-center align-items-center flex-column mt-5">
            <Fab style={{ backgroundColor: '#CACACA', boxShadow: 'none', pointerEvents: 'none' }} size={"medium"} >
                <AddIcon style={{ color: 'white' }} />
            </Fab>
            <Typography variant="h6" style={{ color: '#CACACA', marginTop: 20 }}>Create a new function or select an existing one in the left-hand drawer</Typography>
        </div>
    )
}

export function sanitizeSemvarModule(importPath: string): string {
    // Format is: possibly '@types/' + 'moduleName@V.V.V-alpha' + '...rest'
    const noLeadingFolder = importPath.replace("@types/", "");
    const dirtyModuleName = noLeadingFolder.split("/").shift();
    const cleanModuleName = dirtyModuleName?.split("@").shift();
    if (cleanModuleName) {
        return cleanModuleName + importPath.split(dirtyModuleName!).pop();
    } else {
        return "";
    }
}

export async function loadNodeTypesFromUnpkg(monaco: any, moduleName: string) {
    if (`file:///node_modules/@types/${moduleName}/index.d.ts` in monaco.languages.typescript.typescriptDefaults._extraLibs) {
        return;
    }
    const types = await axios.get(`https://unpkg.com/@types/node/${moduleName}.d.ts`);
    monaco.languages.typescript.typescriptDefaults.addExtraLib(types.data, `file:///node_modules/@types/${moduleName}/index.d.ts`);
}

async function loadTypesFromUnpkg(monaco: any, moduleName: string) {
    // Trying in this order:
    // 1. Use @types unpkg
    // 2. Using regular package.json types or typings (Only difference is remove @types from unpkg url)
    // 3. Just look for index.d.ts in unpkg
    // 4. Import main module

    function fixTypeExport(rawExport: string): string {
        // https://github.com/manferlo81/rollup-plugin-export-equals/blob/master/src/index.ts
        const REGEX_EXPORT_EQUALS = /(\b)export(\s*)=/gm;
        const REGEX_EXPORT_DEFAULT = /(\b)export(\s\s*)default(\s\s*)(.*)/gm;
        if (REGEX_EXPORT_EQUALS.test(rawExport)) {
            return rawExport;
        } else if (REGEX_EXPORT_DEFAULT.test(rawExport)) {
            const replace = 'export = $4';
            return rawExport.replace(REGEX_EXPORT_DEFAULT, replace);
        } else {
            return `declare module "${moduleName}" { declare const _a: any; export = _a; }`;
        }
    }


    async function firstTry(packageName: string, version?: string): Promise<boolean> {
        try {
            const depPackageRes = await axios.get(`https://unpkg.com/@types/${packageName}${version ? `@${version}` : ''}/package.json`);
            let typesFile: string = depPackageRes.data.typings || depPackageRes.data.types || "";
            typesFile = typesFile.startsWith('./') ? typesFile.slice(2) : typesFile;
            if (typesFile) {
                const typesSourceRes = await axios.get(`https://unpkg.com/@types/${packageName}${version ? `@${version}` : ''}/${typesFile}`);
                // TODO: handle multiple type files
                monaco.languages.typescript.typescriptDefaults.addExtraLib(fixTypeExport(typesSourceRes.data), `file:///node_modules/@types/${packageName}/index.d.ts`);
                return true;
            } else {
                throw new Error("No types file");
            }
        } catch (err) {
            return false;
        }
    }

    async function secondTry(packageName: string, version?: string): Promise<boolean> {
        try {
            const depPackageRes = await axios.get(`https://unpkg.com/${packageName}${version ? `@${version}` : ''}/package.json`);
            let typesFile: string = depPackageRes.data.typings || depPackageRes.data.types || "";
            typesFile = typesFile.startsWith('./') ? typesFile.slice(2) : typesFile;
            if (typesFile) {
                const typesSourceRes = await axios.get(`https://unpkg.com/${packageName}${version ? `@${version}` : ''}/${typesFile}`);
                // TODO: handle multiple type files
                monaco.languages.typescript.typescriptDefaults.addExtraLib(fixTypeExport(typesSourceRes.data), `file:///node_modules/@types/${packageName}/index.d.ts`);
                return true;
            } else {
                throw new Error("No types file");
            }
        } catch (err) {
            return false;
        }
    }

    async function thirdTry(packageName: string, version?: string): Promise<boolean> {
        try {
            const depPackageRes = await axios.get(`https://unpkg.com/${packageName}${version ? `@${version}` : ''}/index.d.ts`);
            let typesFile: string = depPackageRes.data.typings || depPackageRes.data.types || "";
            typesFile = typesFile.startsWith('./') ? typesFile.slice(2) : typesFile;
            if (typesFile) {
                const typesSourceRes = await axios.get(`https://unpkg.com/${packageName}${version ? `@${version}` : ''}/${typesFile}`);
                // TODO: handle multiple type files
                monaco.languages.typescript.typescriptDefaults.addExtraLib(fixTypeExport(typesSourceRes.data), `file:///node_modules/@types/${packageName}/index.d.ts`);
                return true;
            } else {
                throw new Error("No types file");
            }
        } catch (err) {
            return false;
        }
    }

    async function fourthTry(packageName: string, version?: string): Promise<boolean> {
        try {
            const depPackageRes = await axios.get(`https://unpkg.com/${packageName}${version ? `@${version}` : ''}/package.json`);
            let typesFile: string = depPackageRes.data.main || depPackageRes.data.module || depPackageRes.data.source || "";
            typesFile = typesFile.startsWith('./') ? typesFile.slice(2) : typesFile;
            if (typesFile) {
                const typesSourceRes = await axios.get(`https://unpkg.com/${packageName}${version ? `@${version}` : ''}/${typesFile}`);
                // TODO: handle multiple type files
                monaco.languages.typescript.typescriptDefaults.addExtraLib(fixTypeExport(typesSourceRes.data), `file:///node_modules/@types/${packageName}/index.d.ts`);
                return true;
            } else {
                throw new Error("No types file");
            }
        } catch (err) {
            return false;
        }
    }

    function fallback(packageName: string, version?: string): boolean {
        monaco.languages.typescript.typescriptDefaults.addExtraLib(`declare module "${packageName}" { declare const _a: any; export = _a; }`, `file:///node_modules/@types/${packageName}/index.d.ts`);
        return true;
    }

    if (`file:///node_modules/@types/${moduleName}/index.d.ts` in monaco.languages.typescript.typescriptDefaults._extraLibs) {
        return;
    }
    // version = (version as string).replace("^", "");
    fallback(moduleName);
    (await firstTry(moduleName)) || (await secondTry(moduleName)) || (await thirdTry(moduleName)) || (await fourthTry(moduleName))
}

export class DependencyMonitor {
    private isResolving?: boolean;
    private debounceTimer?: number;
    private debounceDuration: number = 4000;
    private REGEX_DETECT_REQUIRE = /(?:(?:\\['"`][\s\S])*?(['"`](?=[\s\S]*?require\s*\(['"`][^`"']+?[`'"]\)))(?:\\\1|[\s\S])*?\1|\s*(?:(?:var|const|let)?\s*([_.\w/$]+?)\s*=\s*)?require\s*\(([`'"])((?:@([^/]+?)\/([^/]*?)|[-.@\w/$]+?))\3(?:, ([`'"])([^\7]+?)\7)?\);?)/g; // https://github.com/jonschlinkert/requires-regex/blob/master/index.js
    private nativeModules: string[] = ["assert", "async_hooks", "base", "buffer", "child_process", "cluster", "console", "constants", "crypto", "dgram", "dns", "domain", "events", "fs", "globals", "globals.global", "http", "http2", "https", "inspector", "module", "net", "os", "path", "perf_hooks", "process", "punycode", "querystring", "readline", "repl", "stream", "string_decoder", "timers", "tls", "trace_events", "tty", "url", "util", "v8", "vm", "wasi", "worker_threads", "zlib"];

    debouncedResolveContents(editor: any, monaco: any) {
        const fileName: string = editor.getModel().uri.path.split("/").pop();
        const isValidFile: boolean = fileName.endsWith("js") || fileName.endsWith("ts");
        if (this.isResolving || !isValidFile) {
            return;
        }

        if (this.debounceTimer !== undefined) {
            clearTimeout(this.debounceTimer);
        }
        this.debounceTimer = setTimeout(async () => {
            this.isResolving = true;

            // GO
            const editorVal = editor.getValue();
            const depNameArr = [...editorVal.matchAll(this.REGEX_DETECT_REQUIRE)].map(ele => ele[4]).filter((ele: string) => !!ele && !ele.startsWith(".") && !ele.startsWith("/"));
            console.log("Dependencies to load: ", depNameArr);
            for (const moduleName of depNameArr) {
                if (this.nativeModules.includes(moduleName)) {
                    loadNodeTypesFromUnpkg(monaco, moduleName);
                } else {
                    loadTypesFromUnpkg(monaco, moduleName);
                }
            }

            this.isResolving = false;
            this.debounceTimer = undefined;
        }, this.debounceDuration) as any;
    }
}
