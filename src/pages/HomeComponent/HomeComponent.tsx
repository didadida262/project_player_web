export default function HomeComponent() {
  return (
    <div className="w-full h-full text-[50px] bg-[rgb(91,90,90)]">
      <video
        src="http://localhost:3001/video"
        className="w-full h-full "
        autoPlay
        controls
      ></video>
    </div>
  );
}
