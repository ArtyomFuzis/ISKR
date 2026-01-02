package com.fuzis.booksbackend.service;

import com.fuzis.booksbackend.entity.*;
import com.fuzis.booksbackend.repository.*;
import com.fuzis.booksbackend.transfer.*;
import com.fuzis.booksbackend.transfer.state.State;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class LibraryService {

    private final LibraryRepository libraryRepository;
    private final BookCollectionRepository bookCollectionRepository;
    private final BookRepository bookRepository;
    private final BooksBookCollectionsRepository booksBookCollectionsRepository;
    private final BookReviewRepository bookReviewRepository;
    private final UserRepository userRepository;
    private final ImageLinkRepository imageLinkRepository;
    private final AuthorRepository authorRepository;
    private final GenreRepository genreRepository;
    private final BooksBookCollectionsRepository bbcRepository;

    @Transactional(readOnly = true)
    public ChangeDTO<Object> getVisibleCollections(Integer userId) {
        try {
            log.debug("Getting visible collections for user {}", userId);

            // Получаем коллекции из функции БД
            List<Object[]> visibleCollections = libraryRepository.findVisibleCollectionsForUser(userId);

            if (visibleCollections.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("collections", new ArrayList<>());
                response.put("count", 0);

                return new ChangeDTO<>(State.OK,
                        "No visible collections found", response);
            }

            // Извлекаем ID коллекций
            List<Integer> collectionIds = visibleCollections.stream()
                    .map(row -> (Integer) row[0]) // bcols_id - первый столбец
                    .collect(Collectors.toList());

            // Получаем полную информацию о коллекциях
            List<BookCollection> collections = bookCollectionRepository.findByIdsWithPhotoLinks(collectionIds);

            // Получаем количество книг в каждой коллекции
            List<Object[]> bookCounts = booksBookCollectionsRepository.findBookCountsByCollectionIds(collectionIds);
            Map<Integer, Long> bookCountsMap = bookCounts.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Long) row[1]
                    ));

            // Получаем владельцев
            List<Integer> ownerIds = collections.stream()
                    .map(bc -> bc.getOwner().getUserId())
                    .distinct()
                    .collect(Collectors.toList());

            Map<Integer, User> ownersMap = userRepository.findByIdsWithProfiles(ownerIds).stream()
                    .collect(Collectors.toMap(User::getUserId, u -> u));

            // Получаем изображения коллекций
            List<Integer> imageIds = collections.stream()
                    .map(BookCollection::getPhotoLink)
                    .filter(Objects::nonNull)
                    .map(ImageLink::getImglId)
                    .collect(Collectors.toList());

            Map<Integer, ImageLink> imageLinksMap;
            if (!imageIds.isEmpty()) {
                List<ImageLink> imageLinks = imageLinkRepository.findByIdsWithImageData(imageIds);
                imageLinksMap = imageLinks.stream()
                        .collect(Collectors.toMap(ImageLink::getImglId, il -> il));
            } else {
                imageLinksMap = new HashMap<>();
            }

            // Создаем DTO
            List<LibraryCollectionDTO> collectionDTOs = collections.stream()
                    .map(collection -> {
                        LibraryCollectionDTO dto = new LibraryCollectionDTO();
                        dto.setBcolsId(collection.getBcolsId());
                        dto.setTitle(collection.getTitle());
                        dto.setDescription(collection.getDescription());
                        dto.setConfidentiality(collection.getConfidentiality().name());
                        dto.setBookCollectionType(collection.getCollectionType().name());

                        // Владелец
                        User owner = collection.getOwner();
                        if (owner != null) {
                            dto.setOwnerId(owner.getUserId());
                            User fullOwner = ownersMap.get(owner.getUserId());
                            if (fullOwner != null && fullOwner.getProfile() != null) {
                                dto.setOwnerNickname(fullOwner.getProfile().getNickname());
                            }
                        }

                        // Количество книг
                        dto.setBookCount(bookCountsMap.getOrDefault(collection.getBcolsId(), 0L));

                        // Фото
                        ImageLink photoLink = collection.getPhotoLink();
                        if (photoLink != null) {
                            ImageLink fullImageLink = imageLinksMap.get(photoLink.getImglId());
                            if (fullImageLink != null && fullImageLink.getImageData() != null) {
                                ImageData imageData = fullImageLink.getImageData();
                                ImageDataDTO imageDataDTO = new ImageDataDTO(
                                        imageData.getImgdId(),
                                        imageData.getUuid(),
                                        imageData.getSize(),
                                        imageData.getMimeType(),
                                        imageData.getExtension()
                                );
                                ImageLinkDTO imageLinkDTO = new ImageLinkDTO(
                                        fullImageLink.getImglId(),
                                        imageDataDTO
                                );
                                dto.setPhotoLink(imageLinkDTO);
                            }
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());

            // Сортируем по ID, чтобы сохранить порядок из функции
            collectionDTOs.sort(Comparator.comparing(LibraryCollectionDTO::getBcolsId));

            Map<String, Object> response = new HashMap<>();
            response.put("collections", collectionDTOs);
            response.put("count", collectionDTOs.size());

            log.debug("Found {} visible collections for user {}", collectionDTOs.size(), userId);
            return new ChangeDTO<>(State.OK,
                    "Visible collections retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving visible collections: ", e);
            return new ChangeDTO<>(State.Fail,
                    "Error retrieving visible collections: " + e.getMessage(), null);
        }
    }

    @Transactional(readOnly = true)
    public ChangeDTO<Object> getVisibleBooks(Integer userId) {
        try {
            log.debug("Getting visible books for user {}", userId);

            // Получаем книги из функции БД
            List<Object[]> visibleBooks = libraryRepository.findVisibleBooksForUser(userId);

            if (visibleBooks.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("books", new ArrayList<>());
                response.put("count", 0);

                return new ChangeDTO<>(State.OK,
                        "No visible books found", response);
            }

            // Извлекаем ID книг
            List<Integer> bookIds = visibleBooks.stream()
                    .map(row -> (Integer) row[0]) // book_id - первый столбец
                    .collect(Collectors.toList());

            // Получаем полную информацию о книгах с авторами и жанрами
            List<Book> books = bookRepository.findAllById(bookIds);

            // Для получения авторов и жанров нужно использовать отдельный запрос
            // или изменить текущую логику. Сначала получим книги, потом отдельно авторов и жанры.

            // Получаем средние рейтинги
            List<Object[]> averageRatings = bookReviewRepository.findAverageRatingsByBookIds(bookIds);
            Map<Integer, Double> averageRatingsMap = averageRatings.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Double) row[1]
                    ));

            // Получаем количество коллекций для книг
            List<Object[]> collectionsCounts = bbcRepository.findBookCountsByCollectionIds(bookIds);
            Map<Integer, Long> collectionsCountMap = collectionsCounts.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Long) row[1]
                    ));

            // Получаем изображения книг
            List<Integer> imageIds = books.stream()
                    .map(Book::getPhotoLink)
                    .filter(Objects::nonNull)
                    .map(ImageLink::getImglId)
                    .collect(Collectors.toList());

            Map<Integer, ImageLink> imageLinksMap;
            if (!imageIds.isEmpty()) {
                List<ImageLink> imageLinks = imageLinkRepository.findByIdsWithImageData(imageIds);
                imageLinksMap = imageLinks.stream()
                        .collect(Collectors.toMap(ImageLink::getImglId, il -> il));
            } else {
                imageLinksMap = new HashMap<>();
            }

            // Создаем DTO
            List<LibraryBookDTO> bookDTOs = books.stream()
                    .map(book -> {
                        LibraryBookDTO dto = new LibraryBookDTO();
                        dto.setBookId(book.getBookId());
                        dto.setTitle(book.getTitle());
                        dto.setSubtitle(book.getSubtitle());
                        dto.setIsbn(book.getIsbn());
                        dto.setPageCnt(book.getPageCnt());
                        dto.setAddedBy(book.getAddedBy() != null ? book.getAddedBy().getUserId() : null);

                        // Средний рейтинг
                        Double avgRating = averageRatingsMap.get(book.getBookId());
                        if (avgRating != null) {
                            dto.setAverageRating(Math.round(avgRating * 100.0) / 100.0);
                        }

                        // Количество коллекций
                        dto.setCollectionsCount(collectionsCountMap.getOrDefault(book.getBookId(), 0L));

                        // Фото
                        ImageLink photoLink = book.getPhotoLink();
                        if (photoLink != null) {
                            ImageLink fullImageLink = imageLinksMap.get(photoLink.getImglId());
                            if (fullImageLink != null && fullImageLink.getImageData() != null) {
                                ImageData imageData = fullImageLink.getImageData();
                                ImageDataDTO imageDataDTO = new ImageDataDTO(
                                        imageData.getImgdId(),
                                        imageData.getUuid(),
                                        imageData.getSize(),
                                        imageData.getMimeType(),
                                        imageData.getExtension()
                                );
                                ImageLinkDTO imageLinkDTO = new ImageLinkDTO(
                                        fullImageLink.getImglId(),
                                        imageDataDTO
                                );
                                dto.setPhotoLink(imageLinkDTO);
                            }
                        }

                        // Авторы (нужно дополнительно загрузить)
                        if (book.getAuthors() != null) {
                            dto.setAuthors(book.getAuthors().stream()
                                    .map(author -> new AuthorDTO(
                                            author.getAuthorId(),
                                            author.getName(),
                                            author.getBirthDate(),
                                            author.getDescription(),
                                            author.getRealName()
                                    ))
                                    .collect(Collectors.toList()));
                        }

                        // Жанры (нужно дополнительно загрузить)
                        if (book.getGenres() != null) {
                            dto.setGenres(book.getGenres().stream()
                                    .map(genre -> new GenreDTO(
                                            genre.getGenreId(),
                                            genre.getName()
                                    ))
                                    .collect(Collectors.toList()));
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());

            // Сортируем по ID
            bookDTOs.sort(Comparator.comparing(LibraryBookDTO::getBookId));

            Map<String, Object> response = new HashMap<>();
            response.put("books", bookDTOs);
            response.put("count", bookDTOs.size());

            log.debug("Found {} visible books for user {}", bookDTOs.size(), userId);
            return new ChangeDTO<>(State.OK,
                    "Visible books retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving visible books: ", e);
            return new ChangeDTO<>(State.Fail,
                    "Error retrieving visible books: " + e.getMessage(), null);
        }
    }

    @Transactional(readOnly = true)
    public ChangeDTO<Object> getWishlistBooks(Integer userId) {
        try {
            log.debug("Getting wishlist books for user {}", userId);

            // Получаем вишлист пользователя
            List<BookCollection> wishlists = libraryRepository.findWishlistByUserId(userId);

            if (wishlists.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("books", new ArrayList<>());
                response.put("count", 0);

                return new ChangeDTO<>(State.OK,
                        "No wishlist found for user", response);
            }

            // Вишлист должен быть один, берем первый
            BookCollection wishlist = wishlists.get(0);

            // Получаем книги из вишлиста
            List<BooksBookCollections> booksInWishlist = bbcRepository.findByBookCollection_BcolsId(wishlist.getBcolsId(), null).getContent();

            if (booksInWishlist.isEmpty()) {
                Map<String, Object> response = new HashMap<>();
                response.put("books", new ArrayList<>());
                response.put("count", 0);

                return new ChangeDTO<>(State.OK,
                        "Wishlist is empty", response);
            }

            // Извлекаем ID книг
            List<Integer> bookIds = booksInWishlist.stream()
                    .map(bbc -> bbc.getBook().getBookId())
                    .collect(Collectors.toList());

            // Получаем полную информацию о книгах
            List<Book> books = bookRepository.findAllById(bookIds);

            // Получаем средние рейтинги
            List<Object[]> averageRatings = bookReviewRepository.findAverageRatingsByBookIds(bookIds);
            Map<Integer, Double> averageRatingsMap = averageRatings.stream()
                    .collect(Collectors.toMap(
                            row -> (Integer) row[0],
                            row -> (Double) row[1]
                    ));

            // Получаем изображения книг
            List<Integer> imageIds = books.stream()
                    .map(Book::getPhotoLink)
                    .filter(Objects::nonNull)
                    .map(ImageLink::getImglId)
                    .collect(Collectors.toList());

            Map<Integer, ImageLink> imageLinksMap;
            if (!imageIds.isEmpty()) {
                List<ImageLink> imageLinks = imageLinkRepository.findByIdsWithImageData(imageIds);
                imageLinksMap = imageLinks.stream()
                        .collect(Collectors.toMap(ImageLink::getImglId, il -> il));
            } else {
                imageLinksMap = new HashMap<>();
            }

            // Создаем DTO
            List<LibraryBookDTO> bookDTOs = books.stream()
                    .map(book -> {
                        LibraryBookDTO dto = new LibraryBookDTO();
                        dto.setBookId(book.getBookId());
                        dto.setTitle(book.getTitle());
                        dto.setSubtitle(book.getSubtitle());
                        dto.setIsbn(book.getIsbn());
                        dto.setPageCnt(book.getPageCnt());
                        dto.setAddedBy(book.getAddedBy() != null ? book.getAddedBy().getUserId() : null);

                        // Средний рейтинг
                        Double avgRating = averageRatingsMap.get(book.getBookId());
                        if (avgRating != null) {
                            dto.setAverageRating(Math.round(avgRating * 100.0) / 100.0);
                        }

                        // Фото
                        ImageLink photoLink = book.getPhotoLink();
                        if (photoLink != null) {
                            ImageLink fullImageLink = imageLinksMap.get(photoLink.getImglId());
                            if (fullImageLink != null && fullImageLink.getImageData() != null) {
                                ImageData imageData = fullImageLink.getImageData();
                                ImageDataDTO imageDataDTO = new ImageDataDTO(
                                        imageData.getImgdId(),
                                        imageData.getUuid(),
                                        imageData.getSize(),
                                        imageData.getMimeType(),
                                        imageData.getExtension()
                                );
                                ImageLinkDTO imageLinkDTO = new ImageLinkDTO(
                                        fullImageLink.getImglId(),
                                        imageDataDTO
                                );
                                dto.setPhotoLink(imageLinkDTO);
                            }
                        }

                        // Авторы
                        if (book.getAuthors() != null) {
                            dto.setAuthors(book.getAuthors().stream()
                                    .map(author -> new AuthorDTO(
                                            author.getAuthorId(),
                                            author.getName(),
                                            author.getBirthDate(),
                                            author.getDescription(),
                                            author.getRealName()
                                    ))
                                    .collect(Collectors.toList()));
                        }

                        // Жанры
                        if (book.getGenres() != null) {
                            dto.setGenres(book.getGenres().stream()
                                    .map(genre -> new GenreDTO(
                                            genre.getGenreId(),
                                            genre.getName()
                                    ))
                                    .collect(Collectors.toList()));
                        }

                        return dto;
                    })
                    .collect(Collectors.toList());

            Map<String, Object> response = new HashMap<>();
            response.put("books", bookDTOs);
            response.put("count", bookDTOs.size());
            response.put("wishlistId", wishlist.getBcolsId());
            response.put("wishlistTitle", wishlist.getTitle());

            log.debug("Found {} books in wishlist for user {}", bookDTOs.size(), userId);
            return new ChangeDTO<>(State.OK,
                    "Wishlist books retrieved successfully", response);

        } catch (Exception e) {
            log.error("Error retrieving wishlist books: ", e);
            return new ChangeDTO<>(State.Fail,
                    "Error retrieving wishlist books: " + e.getMessage(), null);
        }
    }
}