import GameStarter from '@/components/GameStarter';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-12 text-white">Tic Tac Toe</h1>
        <p className="text-xl text-gray-400 mb-12">Create a new game and share the link with a friend</p>
        <GameStarter />
      </div>
    </div>
  );
}
