import { useEffect } from 'react';
import {
    $getRoot,
    $createRangeSelection,
    $isParagraphNode,
    ParagraphNode,
    
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';

import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';

import LexicalErrorBoundary from '@lexical/react/LexicalErrorBoundary';

import classes from './styles.module.css';

const theme = {
    paragraph: classes.paragraph,
};

function Placeholder() {
    return <div className={ classes.placeholder }></div>;
}

const HighlightSearchButton = () => {
    const [editor] = useLexicalComposerContext();

    const handleClick = async () => {
        editor.update(() => {
            const searchStr = 'Hello';
            const regex = new RegExp(searchStr, 'gi');
            const children = $getRoot().getChildren();

            for (const child of children) {
                if (!$isParagraphNode(child)) continue;

                const paragraphNode = child as ParagraphNode;
                const text = child.getTextContent();
                const indexes = [];

                let result;
                while ((result = regex.exec(text))) {
                    indexes.push(result.index);
                }

                for (const index of indexes) {
                    const selection = $createRangeSelection();

                    (selection.anchor.key = paragraphNode.getKey()),
                        (selection.anchor.offset = index),
                        (selection.focus.key = paragraphNode.getKey()),
                        (selection.focus.offset = index + searchStr.length);

                    $patchStyleText(selection, { 'background-color': '#22f3bc' });
                }
            }
        });
    };

    return <button onClick={ handleClick }>Highlight Search</button>;
};

export default function Editor() {
    let updateSummariesTimeout: NodeJS.Timeout | null = null;
    
    function MyCustomAutoFocusPlugin() {
        const [editor] = useLexicalComposerContext();

        useEffect(() => {
            editor.focus();
        }, [editor]);

        return null;
    }

    return (
        <>
            <LexicalComposer
                initialConfig={ {
                    namespace: 'essay',
                    theme,
                    onError(error, editor) {
                        console.error(error);
                    },
                } }
            >
                <div className={ classes.editorContainer }>
                    <PlainTextPlugin
                        contentEditable={
                            <ContentEditable className={ classes.editor } />
                        }
                        placeholder={ <Placeholder /> }
                        ErrorBoundary={ LexicalErrorBoundary }
                    />

                    <OnChangePlugin
                        onChange={ (editorState) => {
                            editorState.read(() => {
                                const root = $getRoot();
                                const text = root.getTextContent();
                                
                                if(updateSummariesTimeout) {
                                    clearTimeout(updateSummariesTimeout);
                                    updateSummariesTimeout = null;
                                }

                                updateSummariesTimeout = setTimeout(() => {
                                    console.log(text);
                                }, 1000);
                            });
                        } }
                    />

                    <HistoryPlugin />
                    <MyCustomAutoFocusPlugin />
                </div>
            </LexicalComposer>
        </>
    );
}
