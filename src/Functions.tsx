import React, { useEffect, useContext, useState, useRef } from 'react';
import { InfoPage, LoadingOverlay, useInfoStyles } from './utils';
import * as Container from './Functions-container';
import Editor, { useMonaco } from "@monaco-editor/react";
import Tree from "material-ui-tree";
import { Resizable } from 're-resizable';
import Typography from '@material-ui/core/Typography';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import TextField from '@material-ui/core/TextField';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import FolderIcon from '@material-ui/icons/Folder';
import DescriptionIcon from '@material-ui/icons/Description';
import filenamify from 'filenamify';
import Divider from '@material-ui/core/Divider';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Checkbox from '@material-ui/core/Checkbox';

export default function Function() {
    const [files, setFiles] = useState<Record<string, Container.IFunctionFile>>();
    const [selectedFileName, setSelectedFileName] = useState<string>("");
    const [treeWidth, setTreeWidth] = useState<number>(214);
    const [widthDeltaTracker, setWidthDeltaTracker] = useState<number>();
    const [addFileDialog, setAddFileDialogOpen] = useState<boolean>(false);
    const [isFile, setIsFile] = useState<boolean | undefined>(undefined); // false means it's a folder
    const [newFilePath, setNewFilePath] = useState<string>("");
    const [newFileOrFolderName, setNewFileOrFolderName] = useState<string>("");
    const [saveDialogOpen, setSaveDialogOpen] = useState<boolean>(false);

    const [editorWordWrap, setEditorWordWrap] = useState<boolean>(true);
    const [editorMinimap, setEditorMinimap] = useState<boolean>(true);
    const [editorLargeFont, setEditorLargeFont] = useState<boolean>(false);

    const editorRef = useRef<any>(null);
    const classes = Container.useStyles();
    const monaco = useMonaco();

    const infoClasses: any = useInfoStyles();

    const selectedFunctionName = "MyFunction";

    const functionsMounted = async () => {
        setSelectedFileName("src/handler.js");
        setFiles({
            "package.json": {
                "data": "{\n    \"name\": \"easybase-function\",\n    \"version\": \"1.0.0\",\n    \"description\": \"Easybase Function\",\n    \"main\": \"src/handler.js\",\n    \"keywords\": [],\n    \"dependencies\": {\n      \"figlet\": \"^1.5.0\"\n    }\n}\n\n",
                "date": new Date(),
                "language": "json",
                "isDirectory": false,
                "path": "package.json"
            },
            "src/": {
                "isDirectory": true,
                "path": "src/"
            },
            "src/handler.js": {
                "data": "var figlet = require('figlet');\n\nmodule.exports = async (event, context) => {\n  const textToFig = event.body.message || \"Send me some text!\";\n  const figOptions = event.body.options || \"{}\";\n\n  try {\n    const figResult = figlet.textSync(textToFig, JSON.parse(figOptions))\n    return context.succeed(figResult);\n  } catch (error) {\n    return context.fail(error);\n  }\n}\n",
                "date": new Date(),
                "language": "typescript",
                "isDirectory": false,
                "path": "src/handler.js"
            }
        });
    }

    useEffect(() => {
        functionsMounted();
    }, []);

    useEffect(() => {
        if (files === undefined && editorRef.current && monaco) {
            monaco.editor.getModels().forEach((ele: any) => ele.dispose());
            console.log(monaco.editor.getModels());
        }
    }, [files])

    const onDialogEnter = () => {
        setIsFile(undefined);
        setNewFileOrFolderName("");
    }

    const insertFileCallback = (path: string) => {
        setNewFilePath(path === "/" ? "" : path + "/");
        setAddFileDialogOpen(true);
    }

    const handleDialogSave = () => {
        let _newTotalFileName = newFilePath + newFileOrFolderName;
        if (!isFile && _newTotalFileName.charAt(_newTotalFileName.length - 1) !== "/") {
            _newTotalFileName += "/";
        }

        if (Object.keys(files!).includes(_newTotalFileName)) {
        } else {
            if (isFile) {
                setFiles(prev => ({
                    [_newTotalFileName]: {
                        language: Container.getLanguageFromName(newFileOrFolderName),
                        data: "",
                        date: new Date(),
                        isDirectory: false,
                        path: _newTotalFileName
                    },
                    ...prev
                }));
            } else {
                setFiles(prev => ({
                    [_newTotalFileName]: {
                        isDirectory: true,
                        path: _newTotalFileName
                    },
                    ...prev
                }));
            }
        }

        setAddFileDialogOpen(false);
    }

    const deleteFileCallback = async (path: string) => {
        const confirmedDelete = () => {
            if (path !== "//") {
                const deletedFile = files![path];
                if (deletedFile.isDirectory) {
                    setFiles(prev => {
                        for (const file of Object.keys(prev!)) {
                            if (file.startsWith(path)) {
                                delete prev![file];
                            }
                        }
                        setSelectedFileName(Container.getDefaultFilePath(prev!));
                        return { ...prev };
                    })
                } else {
                    setFiles(prev => {
                        delete prev![path];
                        setSelectedFileName(Container.getDefaultFilePath(prev!));
                        return { ...prev };
                    })
                }
            }
        }

        confirmedDelete();
    }

    const _newCurrentFunctionFile = (): Container.IFunctionFile => ({ ...files![selectedFileName], data: editorRef.current.getValue() })

    const changeFileCallback = (path: string) => {
        if (selectedFileName !== "") {
            setFiles(prev => ({
                ...prev,
                [selectedFileName]: _newCurrentFunctionFile()
            }));
        }
        setSelectedFileName(path);
    }

    function uploadDirectFile(fileName: string, data: string) {
        let _newTotalFileName = newFilePath + fileName;

        if (Object.keys(files!).includes(_newTotalFileName)) {
        } else {
            setFiles(prev => ({
                [_newTotalFileName]: {
                    language: Container.getLanguageFromName(fileName),
                    data: data,
                    date: new Date(),
                    isDirectory: false,
                    path: _newTotalFileName
                },
                ...prev
            }));
        }

        setAddFileDialogOpen(false);
    }

    const onMonacoMount = (editor: any, monaco: any) => {
        editorRef.current = editor;

        const dependencyMonitor = new Container.DependencyMonitor();
        dependencyMonitor.debouncedResolveContents(editor, monaco)
        editor.onDidChangeModelContent((_: any) => {
            dependencyMonitor.debouncedResolveContents(editor, monaco)
        });
        // TODO: typescript `module is undefined. Type npm i @types/node`
    }

    const onBeforeMonacoMount = (monaco: any) => {
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
            ...monaco.languages.typescript.typescriptDefaults.getCompilerOptions(),
            typeRoots: ["file:///node_modules/@types"],
            noUnusedParameters: false,
            noImplicitUseStrict: true,
            noUnusedLocals: true,
            allowJs: true,
            checkJs: true,
            noImplicitAny: false,
            noImplicitReturns: false,
            noImplicitThis: false,
            target: 2,
            allowNonTsExtensions: true,
            moduleResolution: 2,
            module: 1,
            allowSyntheticDefaultImports: true,
            skipLibCheck: true,
            esModuleInterop: true
        });

        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
            ...monaco.languages.typescript.typescriptDefaults.getDiagnosticsOptions(),
            noSemanticValidation: false,
            noSyntaxValidation: false
        });

    }

    const panelStyle = {
        borderLeft: "none",
        borderTop: "none",
        borderRight: "solid 1px #ddd",
        borderBottom: "solid 1px #ddd",
        background: "#fafafa"
    }

    if (!files) return <InfoPage style={{ width: "100vw" }}><div className="mt-5"><LoadingOverlay /></div></InfoPage>;
    else return (
        <InfoPage style={{ width: "100vw", overflowY: "hidden" }}>
            <div className={infoClasses.header}>
                <div style={{ height: 17 }}></div>
                <div className="d-flex align-items-center justify-content-between">
                    <Typography variant="h4"><b>{selectedFunctionName}</b></Typography>
                    <div className="d-flex align-items-center">
                        <Button id="function-save-button" onClick={() => setSaveDialogOpen(true)} variant="contained" disableElevation color="primary">Save</Button>
                    </div>
                </div>
                <div style={{ height: 17 }}></div>
            </div>
            <Container.TestingAccordion route="/YOUR-ROUTE-HERE" />
            <div className="d-flex">
                <Resizable
                    size={{ width: treeWidth, height: "auto" }}
                    onResize={(e, dir, ref, d) => setTreeWidth(widthDeltaTracker! + d.width)}
                    onResizeStart={_ => setWidthDeltaTracker(treeWidth)}
                    minHeight="400px"
                    maxWidth={Container.pageWidth}
                    minWidth={0}
                    style={panelStyle}
                    enable={{ top: false, right: true, bottom: false, left: false, topRight: false, bottomRight: false, bottomLeft: false, topLeft: false }}
                >
                    <Tree
                        data={Container.treeifyPaths(files, selectedFunctionName) as any}
                        labelKey="name"
                        childrenKey="children"
                        valueKey="path"
                        renderLabel={(data, unfoldStatus) => Container.renderLabel(data, unfoldStatus, classes)}
                        getActionsData={(data, path, unfoldStatus): any => Container.getActionsData(data, path, unfoldStatus, classes, insertFileCallback, deleteFileCallback, selectedFileName)}
                        unfoldFirst
                        className={classes.fileTreeRoot}
                        requestChildrenData={(data, path, toggleFoldStatus) => Container.requestChildrenData(data, path, toggleFoldStatus, changeFileCallback)}
                        actionsAlignRight
                    />
                    <div className={classes.borderOverwriter}></div>
                    <div className={classes.borderOverwriter} style={{ bottom: -1, top: "inherit" }}></div>
                </Resizable>
                <div style={{ width: `calc(100vw - ${treeWidth}px)`, maxWidth: `calc(100vw - ${treeWidth}px)` }}>
                    <div className="d-flex align-items-center justify-content-center" style={{ ...panelStyle, height: Container.headerHeight, borderRight: "none !important" }}>
                        <Typography variant="subtitle2">{selectedFileName || "No file selected"}</Typography>
                    </div>
                    <Editor
                        height={`calc(100vh - ${Container.headerHeight * 2}px)`}
                        defaultLanguage={files[selectedFileName]?.language}
                        defaultValue={selectedFileName !== "" ? files[selectedFileName]?.data : ""}
                        onMount={onMonacoMount}
                        beforeMount={onBeforeMonacoMount}
                        path={selectedFileName !== "" ? selectedFunctionName + "/" + selectedFileName : undefined}
                        options={{
                            readOnly: selectedFileName === "",
                            minimap: { scale: 0.75, showSlider: "mouseover", enabled: editorMinimap },
                            padding: { top: 10 },
                            wordWrap: editorWordWrap ? "on" : "off",
                            rulers: [],
                            fontSize: editorLargeFont ? "15" : "12"
                        }}
                    />
                    <div className="d-flex align-items-center justify-content-around" style={{ ...panelStyle, height: Container.headerHeight, borderRight: "none !important", borderTop: "solid 1px #ddd" }}>
                        <FormControlLabel
                            control={<Checkbox size="small" color="secondary" checked={editorWordWrap} onChange={(_, val) => setEditorWordWrap(val)} />}
                            label={<Typography variant="body2" style={{ color: "rgba(0, 0, 0, 0.55)" }}>Word Wrap</Typography>}
                        />
                        <FormControlLabel
                            control={<Checkbox size="small" color="secondary" checked={editorMinimap} onChange={(_, val) => setEditorMinimap(val)} />}
                            label={<Typography variant="body2" style={{ color: "rgba(0, 0, 0, 0.55)" }}>Minimap</Typography>}
                        />
                        <FormControlLabel
                            control={<Checkbox size="small" color="secondary" checked={editorLargeFont} onChange={(_, val) => setEditorLargeFont(val)} />}
                            label={<Typography variant="body2" style={{ color: "rgba(0, 0, 0, 0.55)" }}>Large Font</Typography>}
                        />
                    </div>
                </div>
            </div>
            <Dialog open={addFileDialog} fullWidth onClose={_ => setAddFileDialogOpen(false)} onEnter={onDialogEnter}>
                <DialogTitle>File/Folder Details</DialogTitle>
                <DialogContent className="d-flex flex-column">
                    <div className="d-flex flex-column align-items-center">
                        <TextField style={{ width: 250, marginBottom: 30, marginTop: 20 }} value={newFileOrFolderName} onChange={e => setNewFileOrFolderName(filenamify(e.target.value))} placeholder="Name" />
                        <ToggleButtonGroup value={isFile} exclusive onChange={(_, val) => setIsFile(val)} size="small">
                            <ToggleButton value={false} style={{ width: 125 }}>
                                <FolderIcon className="mr-2" /> Folder
                            </ToggleButton>
                            <ToggleButton value={true} style={{ width: 125 }}>
                                <DescriptionIcon className="mr-2" /> File
                            </ToggleButton>
                        </ToggleButtonGroup>
                    </div>
                    <Divider className="my-5 mx-5" />
                    <Typography variant="body1" className="mb-2" style={{ color: "rgba(0, 0, 0, 0.7)" }}>Or, you can upload directly</Typography>
                    <Container.DragAndDropSingleFile uploadFileCallback={uploadDirectFile} />
                </DialogContent>
                <DialogActions>
                    <Button variant="contained" onClick={_ => setAddFileDialogOpen(false)} disableElevation>Cancel</Button>
                    <Button color="primary" variant="contained" onClick={handleDialogSave} disableElevation disabled={isFile === undefined || newFileOrFolderName.length === 0}>Save</Button>
                </DialogActions>
            </Dialog>
            <Dialog open={saveDialogOpen} maxWidth="sm" fullWidth >
                <DialogTitle>Save Function</DialogTitle>
                <DialogContent>
                    <DialogContentText>Create an account to deploy your own functions!</DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button color="primary" variant="contained" onClick={_ => setSaveDialogOpen(false)} disableElevation >Close</Button>
                </DialogActions>
            </Dialog>
        </InfoPage>
    )
}
