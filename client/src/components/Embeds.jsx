export default function Embeds({ embeds, locationLabel }) {
  if (!embeds?.youtube && !embeds?.maps) return null;
  return (
    <>
      <h2 className="eyebrow">About this place</h2>
      <div className="embeds">
        {embeds.maps && (
          <iframe
            src={embeds.maps}
            title="Map"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        )}
        {embeds.youtube && (
          <a
            className="video-link-card"
            href={embeds.youtube}
            target="_blank"
            rel="noreferrer"
          >
            <div className="yt-play" aria-hidden="true" />
            <div>
              <div className="video-link-label">
                Travel notes from {locationLabel || 'this place'}
              </div>
              <div className="video-link-sub" style={{ marginTop: 8 }}>
                Open in YouTube ↗
              </div>
            </div>
          </a>
        )}
      </div>
    </>
  );
}
