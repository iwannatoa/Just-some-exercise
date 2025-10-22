import { useEffect, useRef, useState } from 'react';
import Entrance from '../component/Entrance';
import DinningRoom from '../component/DinningRoom';
import useKitchenStore from '../store/kitchen.store';
import type { MenuItem } from '../store/data.type';
import { useCookBookStore } from '../store/cookBook.store';
import { useMenuStore } from '../store/menu.store';
import { useTableStore } from '../store/table.store';
import Kitchen from '../component/Kitchen';
import { useLobbyStore } from '../store/lobby.store';

export default function Restaurant() {
  const kitchenStore = useKitchenStore();
  const cookBookStore = useCookBookStore();
  const menuStore = useMenuStore();
  const tableStore = useTableStore();
  const lobbyStore = useLobbyStore();

  const [speed, setSpeed] = useState(1000);
  const intervalId = useRef<number | null>(null);

  const start = () => {
    if (!intervalId.current) {
      intervalId.current = window.setInterval(run, speed);
    }
  };

  const stop = () => {
    if (intervalId.current) {
      window.clearInterval(intervalId.current);
      intervalId.current = null;
    }
  };

  const run = () => {
    tableStore.nextRound();
    kitchenStore.nextRound();
    lobbyStore.nextRound();
  };

  useEffect(() => {
    console.log('useEffect');
    const data = getInitData();
    data.forEach(item => {
      const menuId = menuStore.add({
        id: item.id,
        name: item.name,
        price: item.price,
      });
      cookBookStore.add({
        id: item.id,
        menuId,
        countPerTime: item.countPerTime,
      });
    });
    tableStore.addTable(30);
    kitchenStore.setMaxConcurrentTasks(9);

    return () => {
      tableStore.clearAll();
      menuStore.clearAll();
      cookBookStore.clearAll();
    };
  }, []);

  return (
    <div className='flex flex-col h-full gap-1 p-2'>
      <div className='flex flex-none flex-row justify-between'>
        <h1 className='flex-none'>Restaurant</h1>
        <div className='flex-none'>
          <button onClick={start}>Start</button>
          <button onClick={stop}>Stop</button>
        </div>
      </div>
      <Entrance></Entrance>
      <DinningRoom></DinningRoom>
      <Kitchen></Kitchen>
    </div>
  );
}

function getInitData() {
  return [
    { id: '1', name: '宫保鸡丁', price: 38, countPerTime: 25 },
    { id: '2', name: '麻婆豆腐', price: 28, countPerTime: 20 },
    { id: '3', name: '回锅肉', price: 42, countPerTime: 30 },
    { id: '4', name: '水煮鱼', price: 68, countPerTime: 35 },
    { id: '5', name: '鱼香肉丝', price: 36, countPerTime: 25 },
    { id: '6', name: '糖醋里脊', price: 45, countPerTime: 28 },
    { id: '7', name: '京酱肉丝', price: 39, countPerTime: 26 },
    { id: '8', name: '辣子鸡', price: 48, countPerTime: 32 },
    { id: '9', name: '红烧肉', price: 52, countPerTime: 40 },
    { id: '10', name: '清蒸鲈鱼', price: 78, countPerTime: 45 },
    { id: '11', name: '酸菜鱼', price: 58, countPerTime: 38 },
    { id: '12', name: '干煸豆角', price: 26, countPerTime: 15 },
    { id: '13', name: '地三鲜', price: 24, countPerTime: 18 },
    { id: '14', name: '西红柿鸡蛋', price: 22, countPerTime: 12 },
    { id: '15', name: '青椒土豆丝', price: 18, countPerTime: 10 },
    { id: '16', name: '蒜蓉西兰花', price: 25, countPerTime: 14 },
    { id: '17', name: '红烧茄子', price: 26, countPerTime: 16 },
    { id: '18', name: '蚂蚁上树', price: 28, countPerTime: 22 },
    { id: '19', name: '夫妻肺片', price: 45, countPerTime: 28 },
    { id: '20', name: '口水鸡', price: 38, countPerTime: 25 },
    { id: '21', name: '凉拌黄瓜', price: 15, countPerTime: 8 },
    { id: '22', name: '拍黄瓜', price: 16, countPerTime: 6 },
    { id: '23', name: '酸辣土豆丝', price: 20, countPerTime: 10 },
    { id: '24', name: '葱爆羊肉', price: 55, countPerTime: 35 },
    { id: '25', name: '孜然牛肉', price: 58, countPerTime: 38 },
  ] as (MenuItem & { countPerTime: number })[];
}
