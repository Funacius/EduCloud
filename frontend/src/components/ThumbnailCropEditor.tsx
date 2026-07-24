import { Crop, ImagePlus, Minus, Plus, RotateCcw, X } from 'lucide-react';
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent
} from 'react';

type ThumbnailCropEditorProps = {
  imageSrc: string;
  onCancel: () => void;
  onSave: (file: File) => Promise<void> | void;
};

type Point = {
  x: number;
  y: number;
};

const OUTPUT_WIDTH = 1200;
const OUTPUT_HEIGHT = 900;

function ThumbnailCropEditor({ imageSrc, onCancel, onSave }: ThumbnailCropEditorProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ pointer: Point; offset: Point } | null>(null);
  const [activeImageSrc, setActiveImageSrc] = useState(imageSrc);
  const [localImageSrc, setLocalImageSrc] = useState('');
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (localImageSrc) URL.revokeObjectURL(localImageSrc);
    };
  }, [localImageSrc]);

  const getLayout = (nextZoom = zoom) => {
    const viewport = viewportRef.current;
    if (!viewport || naturalSize.width === 0 || naturalSize.height === 0) return null;

    const viewportWidth = viewport.clientWidth;
    const viewportHeight = viewport.clientHeight;
    const baseScale = Math.max(
      viewportWidth / naturalSize.width,
      viewportHeight / naturalSize.height
    );
    const scale = baseScale * nextZoom;
    const scaledWidth = naturalSize.width * scale;
    const scaledHeight = naturalSize.height * scale;

    return {
      viewportWidth,
      viewportHeight,
      scale,
      scaledWidth,
      scaledHeight,
      maxX: Math.max(0, (scaledWidth - viewportWidth) / 2),
      maxY: Math.max(0, (scaledHeight - viewportHeight) / 2)
    };
  };

  const clampOffset = (point: Point, nextZoom = zoom): Point => {
    const layout = getLayout(nextZoom);
    if (!layout) return point;
    return {
      x: Math.max(-layout.maxX, Math.min(layout.maxX, point.x)),
      y: Math.max(-layout.maxY, Math.min(layout.maxY, point.y))
    };
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!naturalSize.width) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragStartRef.current = {
      pointer: { x: event.clientX, y: event.clientY },
      offset
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const dragStart = dragStartRef.current;
    if (!dragStart) return;
    setOffset(clampOffset({
      x: dragStart.offset.x + event.clientX - dragStart.pointer.x,
      y: dragStart.offset.y + event.clientY - dragStart.pointer.y
    }));
  };

  const finishDragging = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const handleZoomChange = (nextZoom: number) => {
    setZoom(nextZoom);
    setOffset((current) => clampOffset(current, nextZoom));
  };

  const handleReplacementImage = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('Choose a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('The thumbnail image must be 10 MB or smaller.');
      return;
    }

    const source = URL.createObjectURL(file);
    setLocalImageSrc(source);
    setActiveImageSrc(source);
    setNaturalSize({ width: 0, height: 0 });
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError('');
  };

  const handleSave = async () => {
    const image = imageRef.current;
    const layout = getLayout();
    if (!image || !layout) return;

    setIsSaving(true);
    setError('');
    try {
      const sourceWidth = layout.viewportWidth / layout.scale;
      const sourceHeight = layout.viewportHeight / layout.scale;
      const sourceX = (
        layout.scaledWidth / 2
        - layout.viewportWidth / 2
        - offset.x
      ) / layout.scale;
      const sourceY = (
        layout.scaledHeight / 2
        - layout.viewportHeight / 2
        - offset.y
      ) / layout.scale;

      const canvas = document.createElement('canvas');
      canvas.width = OUTPUT_WIDTH;
      canvas.height = OUTPUT_HEIGHT;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('This browser cannot prepare the cropped image.');

      context.drawImage(
        image,
        sourceX,
        sourceY,
        sourceWidth,
        sourceHeight,
        0,
        0,
        OUTPUT_WIDTH,
        OUTPUT_HEIGHT
      );

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (result) => result ? resolve(result) : reject(new Error('Unable to export the cropped image.')),
          'image/webp',
          0.9
        );
      });
      const file = new File([blob], `course-thumbnail-${Date.now()}.webp`, {
        type: 'image/webp'
      });
      await onSave(file);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Unable to save the cropped image.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  const layout = getLayout();
  const imageStyle = layout
    ? {
        width: `${layout.scaledWidth}px`,
        height: `${layout.scaledHeight}px`,
        transform: `translate(-50%, -50%) translate(${offset.x}px, ${offset.y}px)`
      }
    : undefined;

  return (
    <div className="thumbnail-crop-backdrop" role="presentation">
      <section
        aria-labelledby="thumbnail-crop-title"
        aria-modal="true"
        className="thumbnail-crop-dialog"
        role="dialog"
      >
        <header>
          <div>
            <Crop size={21} />
            <span>
              <strong id="thumbnail-crop-title">Edit course thumbnail</strong>
              <small>Drag the image and zoom until the frame looks right.</small>
            </span>
          </div>
          <button type="button" aria-label="Close thumbnail editor" onClick={onCancel}>
            <X size={20} />
          </button>
        </header>

        <div
          className={`thumbnail-crop-viewport${isDragging ? ' is-dragging' : ''}`}
          ref={viewportRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={finishDragging}
          onPointerCancel={finishDragging}
        >
          <img
            ref={imageRef}
            crossOrigin={activeImageSrc.startsWith('blob:') ? undefined : 'anonymous'}
            src={activeImageSrc}
            alt="Thumbnail being cropped"
            draggable={false}
            style={imageStyle}
            onLoad={(event) => {
              setNaturalSize({
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight
              });
              setOffset({ x: 0, y: 0 });
            }}
            onError={() => setError('The image could not be loaded. Choose an image file from your device instead.')}
          />
          <div className="thumbnail-crop-grid" aria-hidden="true" />
        </div>

        <div className="thumbnail-crop-controls">
          <Minus size={17} aria-hidden="true" />
          <input
            aria-label="Thumbnail zoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            onChange={(event) => handleZoomChange(Number(event.target.value))}
          />
          <Plus size={17} aria-hidden="true" />
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
            }}
          >
            <RotateCcw size={16} /> Reset
          </button>
        </div>

        <div className="thumbnail-crop-replace">
          <label>
            <ImagePlus size={17} />
            {error ? 'Choose image from device' : 'Replace image'}
            <input
              className="sr-only"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleReplacementImage}
            />
          </label>
        </div>

        <p className="thumbnail-crop-help">
          The saved thumbnail uses a 4:3 ratio and is optimized to 1200 × 900 px.
        </p>
        {error && <p className="thumbnail-crop-error" role="alert">{error}</p>}

        <footer>
          <button type="button" className="course-editor-cancel" disabled={isSaving} onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className="dashboard-primary-action"
            disabled={isSaving || !naturalSize.width}
            onClick={() => void handleSave()}
          >
            <Crop size={17} /> {isSaving ? 'Saving...' : 'Apply thumbnail'}
          </button>
        </footer>
      </section>
    </div>
  );
}

export default ThumbnailCropEditor;
