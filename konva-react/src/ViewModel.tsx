/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import Konva from 'konva';
import React, { useEffect, useState } from 'react';
import { Image, Group, Rect, Circle, Line, Arrow} from 'react-konva';
import * as Model from './Model';
import { IInteractableLink } from './Simulator';
import { ToolTip } from './Buttons';
import { Marked } from '@ts-stack/markdown';
import { KonvaEventObject } from 'konva/lib/Node';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const _assets: any = {};

export interface IEventArgsInteractable {
    model: Model.Interactable;
    evt: MouseEvent;
}

interface IInteractableProps {
    model: Model.Interactable;
    onClick?: (eventArgs: IEventArgsInteractable) => void;
    onLinkStart?: (eventArgs: IEventArgsInteractable) => void;
    onMouseUp?: (eventArgs: IEventArgsInteractable) => void;
    onMoveCompleted?: (eventArgs: IEventArgsInteractable) => void;
    onPaint?: (model: Model.Interactable) => void;
    key: string;
    isSelected: boolean;
}

export function Interactable(props: IInteractableProps): JSX.Element {
    const [[x,y], setPosition] = useState([props.model.x, props.model.y]);
    const [isOn, setIsOn] = useState(props.model.currentState);
    const groupRef: React.RefObject<Konva.Group> = React.useRef<Konva.Group>(null);

    function handleOnMouseUp(e: KonvaEventObject<MouseEvent>): void {
        if (props.onMouseUp) {
            props.onMouseUp({
                evt: e.evt,
                model: props.model
            });
        }
    }

    function handleDragStart(e: KonvaEventObject<MouseEvent>): void {
        // The gesture for dragging is left mouse button, and there seems no way to
        // argue with Konva about it, except this.  We want to use left-mouse-button
        // dragging to move a pointer, so if we see the shift key is not down, we
        // cancel the drag and tell our parent about the link-start event.  We can't
        // help anymore from here, as we don't get useful events.
        if (!e.evt.shiftKey) {
            if (!groupRef.current) {
                throw new Error('group did not get set in render');
            }

            groupRef.current.stopDrag();

            if (props.onLinkStart) {
                props.onLinkStart({
                    evt: e.evt,
                    model: props.model
                });
            }
        }
        // Else it's a real drag event, let that go.
    }

    function handleDragMove(e: KonvaEventObject<MouseEvent>): void {
        // The documentation gives no clue at all how to do this.  But there's a comment later:
        // var scale = stage.scaleX();
        // var new_pos = event.target.absolutePosition();
        // new_pos.x = (new_pos.x - stage.x()) / scale;
        // new_pos.y = (new_pos.y - stage.y()) / scale;
        // draggedNode.move_to(new_pos);
        //
        // Gonna assume the stage isn't scaled.  (And might you be subject to the layer being scaled as well?)

        const pos = e.target.absolutePosition();
        props.model.setPosition(pos.x, pos.y);
    }

    function handleDragEnd(e: KonvaEventObject<MouseEvent>): void {
        if (props.onMoveCompleted) {
            props.onMoveCompleted({ evt: e.evt, model: props.model});
        }
    }

    function handleClick(eventArgs: KonvaEventObject<MouseEvent>): void {
        if (props.onClick) {
            props.onClick({
                evt: eventArgs.evt,
                model: props.model,
            });
        }
    }

    function handleChangeType(newKind: Model.LogicGateTypes): void {
        if (props.model instanceof Model.LogicGate) {
            props.model.kind = newKind
        }
        else {
            throw Error("Expected a logic gate")
        }
    }

    function handleToggleValue(): void {
        if (props.model instanceof Model.Input) {
            props.model.toggle()
        }
        else {
            throw Error("Expected an Input")
        }
    }

    function handleEditDescription(): void {
        const tooltipEditor: any = document.getElementById('tooltipEditor')!;
        tooltipEditor.model = props.model;
        const textArea = (document.getElementById('tooltipText') as HTMLTextAreaElement)!;
        textArea.value = props.model.description ?? '';
        tooltipEditor.classList.add('visible');

        // Can't just set the focus, because something about the remaining event propagation ends up setting focus
        setTimeout(() => {
            textArea.focus();
        }, 100);
    }

    function handleTicksChange(delta: number): void {
        (props.model as Model.Timer)!.changeSize(delta);
    }

    function handleRecord(isOn: boolean): void {
        (props.model as Model.Input)!.isRecording = isOn;
    }

    function handleContextMenu(eventArgs: KonvaEventObject<MouseEvent>): void {
        eventArgs.evt.preventDefault();
        const menu = document.getElementById('interactableMenu')!;
        menu.style.display = 'initial';
        menu.style.top = eventArgs.evt.pageY + 'px';
        menu.style.left = eventArgs.evt.pageX + 'px';

        document.getElementById('menuItemToAnd')!.style.display = (props.model instanceof Model.LogicGate && props.model.kind !== 'and') ? '' : 'none';
        document.getElementById('menuItemToNand')!.style.display = (props.model instanceof Model.LogicGate && props.model.kind !== 'nand') ? '' : 'none';
        document.getElementById('menuItemToOr')!.style.display = (props.model instanceof Model.LogicGate && props.model.kind !== 'or') ? '' : 'none';
        document.getElementById('menuItemToNor')!.style.display = (props.model instanceof Model.LogicGate && props.model.kind !== 'nor') ? '' : 'none';
        document.getElementById('menuItemToXor')!.style.display = (props.model instanceof Model.LogicGate && props.model.kind !== 'xor') ? '' : 'none';
        document.getElementById('menuItemToXnor')!.style.display = (props.model instanceof Model.LogicGate && props.model.kind !== 'xnor') ? '' : 'none';

        document.getElementById('menuItemAddOneTick')!.style.display = (props.model instanceof Model.Timer) ? '' : 'none';
        document.getElementById('menuItemAddFiveTicks')!.style.display = (props.model instanceof Model.Timer) ? '' : 'none';
        document.getElementById('menuItemMinusOneTick')!.style.display = (props.model instanceof Model.Timer) ? '' : 'none';
        document.getElementById('menuItemMinusFiveTicks')!.style.display = (props.model instanceof Model.Timer) ? '' : 'none';
        
        document.getElementById('menuItemToggle')!.style.display = (props.model instanceof Model.Input) ? '' : 'none';
        document.getElementById('menuItemRecordOn')!.style.display = (props.model instanceof Model.Input && !props.model.isRecording) ? '' : 'none';
        document.getElementById('menuItemRecordOff')!.style.display = (props.model instanceof Model.Input && props.model.isRecording) ? '' : 'none';
        document.getElementById('menuItemPaint')!.style.display = (props.model instanceof Model.Timer) ? 'none' : '';
        if (props.model instanceof Model.Input) {
            document.getElementById('menuItemToggle')!.innerText = props.model.currentState ? 'Toggle off' : 'Toggle on';
        }

        document.getElementById('menuItemToAnd')!.onclick = () => handleChangeType('and');
        document.getElementById('menuItemToNand')!.onclick = () => handleChangeType('nand');
        document.getElementById('menuItemToOr')!.onclick = () => handleChangeType('or');
        document.getElementById('menuItemToNor')!.onclick = () => handleChangeType('nor');
        document.getElementById('menuItemToXor')!.onclick = () => handleChangeType('xor');
        document.getElementById('menuItemToXnor')!.onclick = () => handleChangeType('xnor');
        document.getElementById('menuItemToggle')!.onclick = () => handleToggleValue();
        document.getElementById('menuItemDescribe')!.onclick = () => handleEditDescription();
        document.getElementById('menuItemPaint')!.onclick = () => {
            if (props.onPaint) {
                props.onPaint(props.model);
            } else {
                props.model.paint();
            }
        };

        document.getElementById('menuItemAddOneTick')!.onclick = () => handleTicksChange(1);
        document.getElementById('menuItemMinusOneTick')!.onclick = () => handleTicksChange(-1);
        document.getElementById('menuItemAddFiveTicks')!.onclick = () => handleTicksChange(5);
        document.getElementById('menuItemMinusFiveTicks')!.onclick = () => handleTicksChange(-5);
        document.getElementById('menuItemRecordOn')!.onclick = () => handleRecord(true);
        document.getElementById('menuItemRecordOff')!.onclick = () => handleRecord(false);
    }

    useEffect(() => {
        function handleMoved() {
            setPosition([props.model.x, props.model.y]);
        }
        props.model.onMoved(handleMoved);
        return () => props.model.offMoved(handleMoved);
    }, [props.model]);

    useEffect(() => {
        function handleStateChanged() {
            setIsOn(props.model.currentState);
        }
        props.model.onStateChanged(handleStateChanged);
        return () => props.model.offStateChanged(handleStateChanged);
    }, [props.model]);


    const [tooltip] = React.useState(new ToolTip('interactableTip', props.model.x, props.model.y));

    function handleMouseEnter(): void {
        if (props.model.description || props.model.generatedDescription) {
            let content = '';
            if (props.model.description) {
                content += Marked.parse(props.model.description ?? '');
            }
            const generatedContent = props.model.generatedDescription;
            if (generatedContent) {
                content += '<p class="generatedDescription">' + generatedContent + '</p>';
            }
            document.getElementById('interactableTip')!.innerHTML = content;
            tooltip.x = props.model.x;
            tooltip.y = props.model.y;
            tooltip.startTimer();
        }
    }

    const groupContent: Array<JSX.Element> = [];
    const borderColor = props.isSelected ? 'green' : (props.model.paintColor || '#ffb341');
    groupContent.push(
        <Rect key='surround' height={64} width={64} strokeWidth={5} stroke={borderColor} fill={isOn ? '#26D0F9' : '#384a50'} />
    )
    if (props.model instanceof Model.InteractableWithSingleBitSavedState) {
        groupContent.push(<SavedStateIndicator key='savedStateIndicator' model={props.model}/>)
    }
    if (props.model instanceof Model.LogicGate) {
        groupContent.push(<LogicGate key='logicGate' model={props.model}/>)
    } else if (props.model instanceof Model.Input) {
        groupContent.push(<Input key='input' model={props.model}/>)
    } else if (props.model instanceof Model.Timer) {
        groupContent.push(<Timer key='input' model={props.model}/>)
    }

    return <Group onClick={handleClick}
                  onMouseUp={handleOnMouseUp}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={() => tooltip.clearTimer()}
                  onMouseDown={() => tooltip.clearTimer()}
                  ref={groupRef}
                  draggable
                  x={x}
                  y={y}
                  onContextMenu={handleContextMenu}
                  onDragStart={handleDragStart}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}>
{groupContent}
</Group>
}

interface ISavedStateIndicatorProps {
    model: Model.InteractableWithSingleBitSavedState;
};

function SavedStateIndicator(props: ISavedStateIndicatorProps): JSX.Element | null {
    const [savedState, setSavedState] = useState(props.model.savedState);
    
    useEffect(() => {
        function handleStateChanged() {
            setSavedState(props.model.savedState);
        }
        props.model.onStateChanged(handleStateChanged)
        return () => props.model.offStateChanged(handleStateChanged);
    }, [props.model]);

    const size=16;
    return <Line key='saveStateIndicator'
                points={[63-size, 0, 63, 0, 63, size]}
                fill={savedState ? 'orange' : 'transparent'}
                stroke='orange'
                strokeWidth={4}
                closed={true} />;
}

interface ILogicGateProps {
    model: Model.LogicGate;
}

function LogicGate(props: ILogicGateProps): JSX.Element {
    const [kind, setKind] = useState(props.model.kind);
    
    useEffect(() => {
        function handleStateChanged() {
            setKind(props.model.kind);
        }
        props.model.onStateChanged(handleStateChanged)
        return () => props.model.offStateChanged(handleStateChanged);
    }, [props.model]);
    
    const [isOn, setIsOn] = useState(props.model.currentState);
    useEffect(() => {
        function handleStateChanged() {
            setIsOn(props.model.currentState);
        }
        props.model.onStateChanged(handleStateChanged);
        return () => props.model.offStateChanged(handleStateChanged);
    }, [props.model]);

    // ISSUE: underscore is 'setIsOn' - not sure if really needed?
    const k = kind  + (isOn ? '-white' : '')
    return <Image x={0} y={0} image={_assets[k].image()} />;
}

interface IInputProps {
    model: Model.Input;
}

function Input(props: IInputProps): JSX.Element {
    const [isOn, setIsOn] = useState(props.model.currentState);
    useEffect(() => {
        function handleStateChanged() {
            setIsOn(props.model.currentState);
        }
        props.model.onStateChanged(handleStateChanged);
        return () => props.model.offStateChanged(handleStateChanged);
    }, [props.model]);

    return <Circle key='image' radius={22} x={32} y={32} strokeWidth={8} stroke={isOn ? 'white' : 'black'} />;
}

interface ITimerProps {
    model: Model.Timer;
}

export function Timer(props: ITimerProps): JSX.Element {
    const [tickStorage, setTickStorage] = useState(props.model.tickStorage);
    useEffect(() => {
        function handleStateChanged() {
            setTickStorage([...props.model.tickStorage]);
        }
        props.model.onStateChanged(handleStateChanged)
        return () => props.model.offStateChanged(handleStateChanged);
    }, [props.model]);

    const drawingHeight = 64;
    const drawingWidth = 64;
    const horizontalOffset = 12;
    const verticalOffset = 6;
    const rectHeight = (drawingHeight - 2*verticalOffset) / tickStorage.length;
    function hourglassDelta(index: number): number {
        const l = tickStorage.length;
        const fromEnd = index < tickStorage.length/2 ? index : tickStorage.length-1-index;
        if (fromEnd < l * .2) {
            return 0;
        }
        else if (fromEnd > l * .4) {
            return 6;
        }
        else {
            return 6*(fromEnd - l*.2)/(l*.2);
        }
    }

    return <Group>
            {tickStorage.map((tickValue, index) =>
                <Rect key={index.toString()}
                    x={horizontalOffset + hourglassDelta(index) }
                    width={drawingWidth - 2*horizontalOffset - 2*hourglassDelta(index)}
                    y={drawingHeight - verticalOffset - rectHeight - index*(drawingHeight-2*verticalOffset)/tickStorage.length}
                    height={rectHeight}
                    strokeWidth={1}
                    stroke='darkgrey'
                    fill={tickValue ? 'blue' : 'white'}/>)}
        </Group>;
}

export interface ILinkArrowProps {
    source: Model.Interactable;
    target: Model.Interactable;
    color?: string;
    outlineColor?: string;
    offset?: [number, number];
    isHighlighted?: boolean;
}

/** @summary Given two points, both of which are at the center of 64x64 squares, it returns a pair of endpoints
 * that start and end at the borders of those boxes. */
function getEndpointsOutsideOfBox(sourceX: number, sourceY: number, targetX: number, targetY: number): Array<number> {
    if (Math.abs(targetY-sourceY) < Math.abs(targetX-sourceX)) {
        // The line is less than 45 degrees up, so we'll trim the x's and scale the y's
        const sign = (targetX > sourceX) ? 1 : -1;
        const yTrim = 32*(targetY - sourceY)/(targetX-sourceX);
        sourceX += sign*32;
        targetX -= sign*32;
        sourceY += sign*yTrim;
        targetY -= sign*yTrim;
    }
    else {
        const sign = (targetY > sourceY) ? 1 : -1;
        const xTrim = 32*(targetX - sourceX)/(targetY-sourceY);
        sourceX += sign*xTrim;
        targetX -= sign*xTrim;
        sourceY += sign*32;
        targetY -= sign*32;
    }

    return [sourceX, sourceY, targetX, targetY];
}

export function LinkArrow(props: ILinkArrowProps): JSX.Element {
    const [isLit, setIsLit] = React.useState(props.source.prevState);
    const [[baseSourceX, baseSourceY, baseTargetX, baseTargetY], setPositions] = React.useState(getEndpointsOutsideOfBox(props.source.x+32, props.source.y+32, props.target.x+32, props.target.y+32));

    useEffect(() => {
        function handleStateChanged(): void {
            setIsLit(props.source.prevState);
        }
        function handleSourceOrTargetMoved(): void {
            setPositions(getEndpointsOutsideOfBox(props.source.x+32, props.source.y+32, props.target.x+32, props.target.y+32));
        }

        props.source.onStateChanged(handleStateChanged);
        props.source.onMoved(handleSourceOrTargetMoved);
        props.target.onMoved(handleSourceOrTargetMoved);

        return () => {
            props.source.offStateChanged(handleStateChanged);
            props.source.offMoved(handleSourceOrTargetMoved);
            props.target.offMoved(handleSourceOrTargetMoved);
        };
    }, [props.source, props.target]);

    const offX = props.offset ? props.offset[0] : 0;
    const offY = props.offset ? props.offset[1] : 0;
    const sourceX = baseSourceX + offX;
    const sourceY = baseSourceY + offY;
    const targetX = baseTargetX + offX;
    const targetY = baseTargetY + offY;

    const defaultColor = isLit ? 'darkblue' : 'teal';
    const color = props.color || defaultColor;
    const outlineColor = props.outlineColor || color;
    const hasOutline = props.outlineColor !== undefined && props.outlineColor !== '';

    const points = [0, 0, targetX - sourceX, targetY - sourceY];

    return (
        <Group>
            {props.isHighlighted && (
                <Arrow
                    x={sourceX}
                    y={sourceY}
                    points={points}
                    fill='white'
                    stroke='white'
                    strokeWidth={8}
                    pointerLength={10}
                    pointerWidth={10}
                />
            )}
            {hasOutline && (
                <Arrow
                    x={sourceX}
                    y={sourceY}
                    points={points}
                    fill={outlineColor}
                    stroke={outlineColor}
                    strokeWidth={6}
                    pointerLength={10}
                    pointerWidth={10}
                />
            )}
            <Arrow
                x={sourceX}
                y={sourceY}
                points={points}
                fill={color}
                stroke={color}
                strokeWidth={4}
                pointerLength={10}
                pointerWidth={10}
            />
        </Group>
    );
}

const OVERLAP_SPACING = 6;
const OVERLAP_COLORS = [
    '#e6194b', '#3cb44b', '#ffe119', '#4363d8', '#f58231',
    '#911eb4', '#42d4f4', '#f032e6', '#a9a9a9', '#9A6324'
];

function segmentsOverlap(a: [number, number, number, number], b: [number, number, number, number]): boolean {
    const [ax1, ay1, ax2, ay2] = a;
    const [bx1, by1, bx2, by2] = b;

    const dx1 = ax2 - ax1;
    const dy1 = ay2 - ay1;
    const dx2 = bx2 - bx1;
    const dy2 = by2 - by1;

    const len1Sq = dx1 * dx1 + dy1 * dy1;
    const len2Sq = dx2 * dx2 + dy2 * dy2;
    if (len1Sq < 0.01 || len2Sq < 0.01) return false;

    const crossDirs = dx1 * dy2 - dy1 * dx2;
    if (Math.abs(crossDirs) > 0.1) return false;

    const abx = bx1 - ax1;
    const aby = by1 - ay1;
    const crossAB = dx1 * aby - dy1 * abx;
    if (Math.abs(crossAB) > 0.1) return false;

    const dotAA = dx1 * dx1 + dy1 * dy1;
    const projA1 = 0;
    const projA2 = dotAA;
    const projB1 = abx * dx1 + aby * dy1;
    const projB2 = (bx2 - ax1) * dx1 + (by2 - ay1) * dy1;

    const minA = Math.min(projA1, projA2);
    const maxA = Math.max(projA1, projA2);
    const minB = Math.min(projB1, projB2);
    const maxB = Math.max(projB1, projB2);

    const overlap = Math.min(maxA, maxB) - Math.max(minA, minB);
    return overlap > 0.1;
}

function getPerpendicularUnitVector(segment: [number, number, number, number]): [number, number] {
    const dx = segment[2] - segment[0];
    const dy = segment[3] - segment[1];
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len < 0.001) return [0, 0];
    return [-dy / len, dx / len];
}

interface IProcessedLink {
    link: IInteractableLink;
    offset: [number, number];
    color?: string;
    outlineColor?: string;
}

export function computeProcessedLinks(links: IInteractableLink[]): IProcessedLink[] {
    if (links.length === 0) return [];

    const endpoints = links.map(l =>
        getEndpointsOutsideOfBox(l.source.x + 32, l.source.y + 32, l.target.x + 32, l.target.y + 32) as [number, number, number, number]
    );

    const adj: number[][] = links.map(() => []);
    for (let i = 0; i < links.length; i++) {
        for (let j = i + 1; j < links.length; j++) {
            if (segmentsOverlap(endpoints[i], endpoints[j])) {
                adj[i].push(j);
                adj[j].push(i);
            }
        }
    }

    const visited = new Array(links.length).fill(false);
    const components: number[][] = [];

    for (let i = 0; i < links.length; i++) {
        if (visited[i] || adj[i].length === 0) continue;

        const stack = [i];
        visited[i] = true;
        const comp: number[] = [];

        while (stack.length > 0) {
            const node = stack.pop()!;
            comp.push(node);
            for (const neighbor of adj[node]) {
                if (!visited[neighbor]) {
                    visited[neighbor] = true;
                    stack.push(neighbor);
                }
            }
        }
        components.push(comp);
    }

    const result: IProcessedLink[] = links.map(link => ({
        link,
        offset: [0, 0] as [number, number],
    }));

    for (const comp of components) {
        if (comp.length < 2) continue;

        const firstSeg = endpoints[comp[0]];
        const perp = getPerpendicularUnitVector(firstSeg);

        const count = comp.length;
        const startOffset = -((count - 1) * OVERLAP_SPACING) / 2;

        for (let k = 0; k < count; k++) {
            const idx = comp[k];
            const offsetVal = startOffset + k * OVERLAP_SPACING;
            result[idx].offset = [perp[0] * offsetVal, perp[1] * offsetVal];
            result[idx].color = OVERLAP_COLORS[k % OVERLAP_COLORS.length];
            result[idx].outlineColor = 'black';
        }
    }

    return result;
}

interface ILinkArrowLayerProps {
    links: IInteractableLink[];
    interactables: Model.Interactable[];
    selected?: Model.Interactable;
}

export function LinkArrowLayer(props: ILinkArrowLayerProps): JSX.Element {
    const [positionsVersion, setPositionsVersion] = React.useState(0);
    const rafRef = React.useRef<number | null>(null);

    useEffect(() => {
        function handleMoved() {
            if (rafRef.current === null) {
                rafRef.current = requestAnimationFrame(() => {
                    rafRef.current = null;
                    setPositionsVersion(v => v + 1);
                });
            }
        }

        for (const i of props.interactables) {
            i.onMoved(handleMoved);
        }

        return () => {
            if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current);
                rafRef.current = null;
            }
            for (const i of props.interactables) {
                i.offMoved(handleMoved);
            }
        };
    }, [props.interactables]);

    void positionsVersion;
    const processedLinks = computeProcessedLinks(props.links);

    return (
        <Group>
            {processedLinks.map(pl => (
                <LinkArrow
                    key={pl.link.source.id + "-" + pl.link.target.id}
                    source={pl.link.source}
                    target={pl.link.target}
                    color={pl.color}
                    outlineColor={pl.outlineColor}
                    offset={pl.offset[0] !== 0 || pl.offset[1] !== 0 ? pl.offset : undefined}
                    isHighlighted={props.selected !== undefined && (pl.link.source === props.selected || pl.link.target === props.selected)}
                />
            ))}
        </Group>
    );
}

export function loadAssets(onComplete: () => void): void
{
    const assetKeys = ['and-white', 'and-black',
        'or-white', 'or-black',
        'xor-white', 'xor-black',
        'nand-white', 'nand-black',
        'nor-white', 'nor-black',
        'xnor-white', 'xnor-black',
        'paint-black']
    for (const kind of assetKeys) {
        // This whole thing is bad and this element is also bad...
        Konva.Image.fromURL('/scrapmechaniclogicgatesim/' + kind + '.png', (img: string) => {
            _assets[kind.replace('-black', '')] = img;
            if (Object.keys(_assets).length === assetKeys.length) {
                onComplete();
            }
          });
    }
}