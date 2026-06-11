function isArrayBuffer(value: unknown): value is ArrayBuffer {
  return !!('ArrayBuffer' in globalThis) && value instanceof ArrayBuffer;
}

function isAudioData(value: unknown): value is AudioData {
  return !!('AudioData' in globalThis) && value instanceof AudioData;
}

function isImageBitmap(value: unknown): value is ImageBitmap {
  return !!('ImageBitmap' in globalThis) && value instanceof ImageBitmap;
}

function isMediaSourceHandle(value: unknown): value is MediaSourceHandle {
  return !!('MediaSourceHandle' in globalThis) && value instanceof MediaSourceHandle;
}

function isMediaStreamTrack(value: unknown): value is MediaStreamTrack {
  return !!('MediaStreamTrack' in globalThis) && value instanceof MediaStreamTrack;
}

function isMessagePort(value: unknown): value is MessagePort {
  return !!('MessagePort' in globalThis) && value instanceof MessagePort;
}

function isMIDIAccess(value: unknown): value is MIDIAccess {
  return !!('MIDIAccess' in globalThis) && value instanceof MIDIAccess;
}

function isOffscreenCanvas(value: unknown): value is OffscreenCanvas {
  return !!('OffscreenCanvas' in globalThis) && value instanceof OffscreenCanvas;
}

function isReadableStream(value: unknown): value is ReadableStream {
  return !!('ReadableStream' in globalThis) && value instanceof ReadableStream;
}

function isRTCDataChannel(value: unknown): value is RTCDataChannel {
  return !!('RTCDataChannel' in globalThis) && value instanceof RTCDataChannel;
}

function isTransformStream(value: unknown): value is TransformStream {
  return !!('TransformStream' in globalThis) && value instanceof TransformStream;
}

function isVideoFrame(value: unknown): value is VideoFrame {
  return !!('VideoFrame' in globalThis) && value instanceof VideoFrame;
}

function isWebTransportReceiveStream(value: unknown): boolean {
  return (
    !!(
      (
        'WebTransportReceiveStream' in globalThis &&
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        typeof (globalThis as any)['WebTransportReceiveStream'] === 'function'
      )
      // @ts-expect-error WebTransportReceiveStream is not in TypeScript yet
    ) && value instanceof globalThis.WebTransportReceiveStream
  );
}

function isWebTransportSendStream(value: unknown): boolean {
  return (
    !!(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ('WebTransportSendStream' in globalThis && typeof (globalThis as any)['WebTransportSendStream'] === 'function')
      // @ts-expect-error WebTransportSendStream is not in TypeScript yet
    ) && value instanceof globalThis.WebTransportSendStream
  );
}

function isWritableStream(value: unknown): value is WritableStream {
  return !!('WritableStream' in globalThis) && value instanceof WritableStream;
}

function isTransferable(value: unknown): boolean {
  return (
    isArrayBuffer(value) ||
    isAudioData(value) ||
    isImageBitmap(value) ||
    isMediaSourceHandle(value) ||
    isMediaStreamTrack(value) ||
    isMessagePort(value) ||
    isMIDIAccess(value) ||
    isOffscreenCanvas(value) ||
    isReadableStream(value) ||
    isRTCDataChannel(value) ||
    isTransformStream(value) ||
    isVideoFrame(value) ||
    isWebTransportReceiveStream(value) ||
    isWebTransportSendStream(value) ||
    isWritableStream(value)
  );
}

export default isTransferable;
