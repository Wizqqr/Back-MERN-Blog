import UserModel from '../models/User.js'; 
import PostModel from '../models/Post.js'; 


export const getAll = async (req, res) => {
  try {
      const posts = await PostModel.find()
          .populate('user')
          .sort({ createdAt: -1 })
          .exec();

      res.json(posts);
  } catch (err) {
      console.log(err);
      res.status(500).json({
          message: 'Не удалось получить список постов'
      });
  }
};


export const getLastTags = async (req,res) => {
  try {
    // Получаем все посты
    const posts = await PostModel.find().exec();
    
    // Собираем все теги из постов
    const tags = posts.map(post => post.tags).flat();
    
    // Подсчитываем частоту использования тегов
    const tagCounts = tags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {});
    
    // Преобразуем объект в массив и сортируем по убыванию частоты
    const sortedTags = Object.entries(tagCounts)
      .sort(([, countA], [, countB]) => countB - countA)
      .slice(0, 5)
      .map(([tag]) => tag);
    
    // Отправляем результат
    res.json(sortedTags);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось получить список тегов'
    });
  }
}

// В контроллере
export const getPopularPosts = async (req, res) => {
  try {
    const posts = await PostModel.find().sort({ viewsCount: -1 }).limit(5).populate('user').exec();

    if (posts.length === 0) {
      return res.status(404).json({ message: 'Популярные посты не найдены' });
    }
    res.json(posts);
  } catch (err) {
    console.error('Ошибка при получении популярных постов:', err);
    res.status(500).json({ message: 'Не удалось получить список популярных постов' });
  }
};

export const getMyPosts = async(req,res) => {
  try{
    const userId = req.userId; // Проверить, установлен ли userId
    console.log(`Fetching my posts for user ${userId}`); // ��огирование для проверки
    
    // Найти все посты текущего пользователя
    const posts = await PostModel.find({ user: userId }).populate('user');
    if (posts.length === 0) {
      return res.status(404).json({ message: 'Мои посты не найдены' });
    }
    res.json(posts);
    
  }catch(error){
    console.log(error);
    res.status(500).json({
      message: 'Не удалось получить список моих постов'
    });
  }
}


export const getOne = async (req, res) => {
  try {
    const postId = req.params.id;
    const userId = req.userId; // Проверить, установлен ли userId

    console.log(`Fetching post ${postId} for user ${userId}`); // Логирование для проверки

    // Найти пост по ID
    const post = await PostModel.findById(postId).populate('user');
    if (!post) {
      return res.status(404).json({ message: 'Пост не найден' });
    }

    if (userId) {
      // Найти пользователя
      const user = await UserModel.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'Пользователь не найден' });
      }

      // Проверить, был ли пост уже просмотрен
      if (!user.viewedPosts.includes(postId)) {
        user.viewedPosts.push(postId);
        await user.save();
        
        // Увеличить количество просмотров поста
        post.viewsCount += 1;
        await post.save();
      }
    } else {
      await post.save();
    }

    // Отправить пост клиенту
    res.json(post);
  } catch (err) {
    console.error('Error in getOne:', err.message);
    res.status(500).json({ message: 'Не удалось получить пост' });
  }
};

export const remove = async (req, res) => {
  try {
    const postId = req.params.id;

    const doc = await PostModel.findOneAndDelete({ _id: postId });

    if (!doc) {
      return res.status(404).json({
        message: 'Статья не найдена',
      });
    }

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось удалить статью',
    });
  }
};


export const update = async (req, res) => {
  try {
    const postId = req.params.id;
    const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

    await PostModel.updateOne(
      {
        _id: postId,
      },
      {
        title: req.body.title,
        text: req.body.text,
        imageUrl: req.body.imageUrl,
        user: req.userId,
        tags:tags,
      },
    );

    res.json({
      success: true,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: 'Не удалось обновить статью',
    });
  }
};

export const create = async (req,res) =>{
    try{
      const tags = req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : [];

        const doc = new PostModel({
            title: req.body.title,
            text: req.body.text,
            imageUrl: req.body.imageUrl,
            tags: tags,
            user: req.userId,
        });

        const post = await doc.save();
        res.json(post);

    }catch(err){
        console.log(err);
        res.status(500).json({message: err.message})
    }
}
