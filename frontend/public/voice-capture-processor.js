class VoiceCaptureProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 4096;
    this.buffer = new Float32Array(this.bufferSize);
    this.offset = 0;
  }

  process(inputs, outputs) {
    const input = inputs[0]?.[0];
    if (input) {
      let inputOffset = 0;
      while (inputOffset < input.length) {
        const copyLength = Math.min(
          this.bufferSize - this.offset,
          input.length - inputOffset,
        );
        this.buffer.set(
          input.subarray(inputOffset, inputOffset + copyLength),
          this.offset,
        );
        this.offset += copyLength;
        inputOffset += copyLength;

        if (this.offset === this.bufferSize) {
          const completedBuffer = this.buffer;
          this.buffer = new Float32Array(this.bufferSize);
          this.offset = 0;
          this.port.postMessage(completedBuffer, [completedBuffer.buffer]);
        }
      }
    }

    for (const channel of outputs[0] ?? []) {
      channel.fill(0);
    }
    return true;
  }
}

registerProcessor("voice-capture-processor", VoiceCaptureProcessor);
